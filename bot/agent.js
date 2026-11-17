#!/usr/bin/env node
/**
 * Yuerta Stock Agent — Base Stocks Maxxing (Agentic Stock Finance track)
 *
 * Rule-based, deterministic trading bot for tokenized US stocks on Base Sepolia.
 * - Prices: Yahoo Finance chart API (free, no key).
 * - Strategy: 5d vs 20d SMA crossover + 14d RSI proxy + 1d momentum.
 * - Live mode: pushes prices via StockMarket.setPrice, trades via
 *   StockMarket.agentTrade, rebalances AgentVault via agentBuy/agentSell.
 * - Dry-run mode (default when bot/addresses.json is missing): fetches prices,
 *   computes signals, paper-trades, writes state, sends NO transactions.
 *
 * $0 spend. Testnet only (Base Sepolia 84532). Never touches mainnet.
 * Private key is read from bot-key.json ONLY in live mode and is never printed.
 *
 * Usage:
 *   node agent.js --dry-run   (default if addresses.json is missing)
 *   node agent.js --live      (requires bot/addresses.json + funded bot key)
 */

const fs = require('node:fs');
const path = require('node:path');

const { ethers } = require('ethers');

const DIR = __dirname;
const STATE_PATH = path.join(DIR, 'state.json');
const LOG_PATH = path.join(DIR, 'trades.log');
const ADDRESSES_PATH = path.join(DIR, 'addresses.json');
const KEY_PATH = path.join(DIR, '..', 'bot-key.json');

const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532;

// Frozen contract interface — docs/PLAN.md §3. Do not change.
const TICKERS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD'];
const STOCK_IDS = { AAPL: 0, NVDA: 1, MSFT: 2, TSLA: 3, AMZN: 4, GOOGL: 5, META: 6, AMD: 7 };

const MAX_TRADE_TUSDC = 1000; // cap per agent trade (tUSDC)
const MAX_VAULT_PCT = 0.25; // max 25% of vault per rebalance trade
const PAPER_SEED_TUSDC = 5000; // dry-run paper portfolio seed
const RSI_OVERBOUGHT = 75;
const RSI_BUY_MAX = 70;

const YAHOO_URL = (t) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=1mo&interval=1d`;
const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' };

// Minimal ABIs (frozen interface only)
const MARKET_ABI = [
  'function tUSDC() view returns (address)',
  'function stockToken(uint8 id) view returns (address)',
  'function price(uint8 id) view returns (uint256 priceUsd8, uint256 updatedAt)',
  'function feeBps() view returns (uint256)',
  'function setPrice(uint8 id, uint256 priceUsd8)',
  'function agentTrade(uint8 id, bool isBuy, uint256 amount, string reason)',
  'function totalVolumeUsd() view returns (uint256)',
  'function tradeCount() view returns (uint256)',
];
const VAULT_ABI = [
  'function agentBuy(uint8 id, uint256 usdcAmount)',
  'function agentSell(uint8 id, uint256 stockAmount)',
  'function totalAssets() view returns (uint256)',
  'function navPerShare() view returns (uint256)',
];
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();
const fmtUsd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => `${(n * 100).toFixed(2)}%`;

function logLine(msg) {
  const line = `[${nowIso()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

// ---------- price fetching ----------
async function fetchCloses(ticker, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(YAHOO_URL(ticker), { headers: UA, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      const closes = result?.indicators?.quote?.[0]?.close?.filter((c) => typeof c === 'number');
      if (!closes || closes.length < 21) throw new Error(`too few bars (${closes?.length ?? 0})`);
      return closes;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * attempt);
    }
  }
}

// ---------- indicators ----------
function sma(values, n) {
  const slice = values.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// 14-day RSI (Wilder smoothing), proxy from daily closes.
function rsi14(closes) {
  const changes = [];
  for (let i = 1; i < closes.length; i++) changes.push(closes[i] - closes[i - 1]);
  const period = 14;
  const seed = changes.slice(0, period);
  let gain = seed.filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  let loss = seed.filter((c) => c < 0).reduce((a, b) => a - b, 0) / period;
  for (const c of changes.slice(period)) {
    gain = (gain * (period - 1) + Math.max(c, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-c, 0)) / period;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

function computeSignal(ticker, closes) {
  const price = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const sma5 = sma(closes, 5);
  const sma20 = sma(closes, 20);
  const rsi = rsi14(closes);
  const momentum = (price - prev) / prev;

  let signal = 'HOLD';
  let reason = '';
  if (sma5 > sma20 && rsi < RSI_BUY_MAX) {
    signal = 'BUY';
    reason = `Uptrend: 5d SMA ${fmtUsd(sma5)} above 20d SMA ${fmtUsd(sma20)}, RSI ${rsi.toFixed(1)} below 70.`;
  } else if (sma5 < sma20 || rsi > RSI_OVERBOUGHT) {
    signal = 'SELL';
    reason =
      sma5 < sma20
        ? `Downtrend: 5d SMA ${fmtUsd(sma5)} below 20d SMA ${fmtUsd(sma20)}, RSI ${rsi.toFixed(1)}.`
        : `Overbought: RSI ${rsi.toFixed(1)} above 75 while 5d SMA ${fmtUsd(sma5)} vs 20d SMA ${fmtUsd(sma20)}.`;
  } else {
    reason = `No edge: 5d SMA ${fmtUsd(sma5)} vs 20d SMA ${fmtUsd(sma20)}, RSI ${rsi.toFixed(1)}, momentum ${fmtPct(momentum)}.`;
  }
  return { ticker, price, prevClose: prev, sma5, sma20, rsi, momentum, signal, reason };
}

// ---------- state ----------
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function loadAddresses() {
  try {
    return JSON.parse(fs.readFileSync(ADDRESSES_PATH, 'utf8'));
  } catch {
    return null;
  }
}

// ---------- dry-run paper portfolio ----------
// Paper portfolio: { tusdc: number, stocks: { TICKER: shares } } in USD/share units.
function paperTrade(portfolio, sig) {
  const { ticker, price, signal } = sig;
  const held = portfolio.stocks[ticker] || 0;
  if (signal === 'BUY') {
    const spend = Math.min(MAX_TRADE_TUSDC, portfolio.tusdc);
    if (spend < 10) return { action: 'SKIP', detail: `paper cash too low (${fmtUsd(portfolio.tusdc)})` };
    const fee = spend * 0.003;
    const shares = (spend - fee) / price;
    portfolio.tusdc -= spend;
    portfolio.stocks[ticker] = held + shares;
    return { action: 'PAPER_BUY', detail: `bought ${shares.toFixed(4)} ${ticker} for ${fmtUsd(spend)} (fee ${fmtUsd(fee)})` };
  }
  if (signal === 'SELL') {
    if (held <= 0) return { action: 'SKIP', detail: `no ${ticker} position to sell` };
    const maxSharesByCap = MAX_TRADE_TUSDC / price;
    const shares = Math.min(held, maxSharesByCap);
    const gross = shares * price;
    const fee = gross * 0.003;
    portfolio.tusdc += gross - fee;
    portfolio.stocks[ticker] = held - shares;
    return { action: 'PAPER_SELL', detail: `sold ${shares.toFixed(4)} ${ticker} for ${fmtUsd(gross - fee)} (fee ${fmtUsd(fee)})` };
  }
  return { action: 'HOLD', detail: 'no paper trade' };
}

// ---------- live mode ----------
async function ensureAllowance(token, owner, spender, amount, wallet) {
  const current = await token.allowance(owner, spender);
  if (current >= amount) return;
  logLine(`  approve tUSDC -> ${spender.slice(0, 10)}... ${ethers.formatUnits(amount, 6)}`);
  const tx = await token.connect(wallet).approve(spender, amount);
  await tx.wait();
}

async function runLive(addresses, signals, wallet, provider) {
  const market = new ethers.Contract(addresses.stockMarket, MARKET_ABI, provider);
  const vault = new ethers.Contract(addresses.agentVault, VAULT_ABI, provider);
  const tusdc = new ethers.Contract(addresses.tUSDC, ERC20_ABI, provider);
  const marketW = market.connect(wallet);
  const vaultW = vault.connect(wallet);
  const executed = [];

  // 1) Push prices for all 8 tickers.
  for (const sig of signals) {
    const id = STOCK_IDS[sig.ticker];
    const priceUsd8 = BigInt(Math.round(sig.price * 1e8));
    logLine(`  setPrice ${sig.ticker} = ${fmtUsd(sig.price)} (${priceUsd8} @8dp)`);
    const tx = await marketW.setPrice(id, priceUsd8);
    const rc = await tx.wait();
    executed.push({ type: 'setPrice', ticker: sig.ticker, tx: rc.hash });
  }

  // 2) Agent trades (own portfolio), max 1 per ticker, cap 1,000 tUSDC.
  const agentTusdc = await tusdc.balanceOf(wallet.address);
  for (const sig of signals) {
    const id = STOCK_IDS[sig.ticker];
    if (sig.signal === 'BUY') {
      const spend = BigInt(Math.min(MAX_TRADE_TUSDC, Number(ethers.formatUnits(agentTusdc, 6)))) * 10n ** 6n;
      if (spend < 10n * 10n ** 6n) { logLine(`  SKIP agentTrade BUY ${sig.ticker}: agent tUSDC too low`); continue; }
      await ensureAllowance(tusdc, wallet.address, addresses.stockMarket, spend, wallet);
      logLine(`  agentTrade BUY ${sig.ticker} ${fmtUsd(Number(ethers.formatUnits(spend, 6)))} — ${sig.reason}`);
      const tx = await marketW.agentTrade(id, true, spend, sig.reason);
      const rc = await tx.wait();
      executed.push({ type: 'agentTrade', ticker: sig.ticker, side: 'BUY', tx: rc.hash });
    } else if (sig.signal === 'SELL') {
      const stockAddr = addresses.stockTokens?.[sig.ticker] ?? (await market.stockToken(id));
      const stock = new ethers.Contract(stockAddr, ERC20_ABI, provider);
      const held = await stock.balanceOf(wallet.address);
      if (held === 0n) { logLine(`  SKIP agentTrade SELL ${sig.ticker}: no position`); continue; }
      const capShares = BigInt(Math.floor((MAX_TRADE_TUSDC / sig.price) * 1e8));
      const amount = held < capShares ? held : capShares;
      logLine(`  agentTrade SELL ${sig.ticker} ${ethers.formatUnits(amount, 8)} shares — ${sig.reason}`);
      const tx = await marketW.agentTrade(id, false, amount, sig.reason);
      const rc = await tx.wait();
      executed.push({ type: 'agentTrade', ticker: sig.ticker, side: 'SELL', tx: rc.hash });
    }
  }

  // 3) Vault rebalance, max 25% of vault per trade.
  try {
    const totalAssets = await vault.totalAssets(); // 6dp tUSDC
    const totalAssetsUsd = Number(ethers.formatUnits(totalAssets, 6));
    const vaultCap = totalAssetsUsd * MAX_VAULT_PCT;
    if (vaultCap >= 10) {
      for (const sig of signals) {
        const id = STOCK_IDS[sig.ticker];
        if (sig.signal === 'BUY') {
          const vaultTusdc = await tusdc.balanceOf(addresses.agentVault);
          const spendUsd = Math.min(vaultCap, Number(ethers.formatUnits(vaultTusdc, 6)));
          if (spendUsd < 10) continue;
          const spend = BigInt(Math.floor(spendUsd * 1e6));
          logLine(`  vault agentBuy ${sig.ticker} ${fmtUsd(spendUsd)} (<=25% of vault ${fmtUsd(totalAssetsUsd)})`);
          const tx = await vaultW.agentBuy(id, spend);
          const rc = await tx.wait();
          executed.push({ type: 'vaultBuy', ticker: sig.ticker, tx: rc.hash });
        } else if (sig.signal === 'SELL') {
          const stockAddr = addresses.stockTokens?.[sig.ticker] ?? (await market.stockToken(id));
          const stock = new ethers.Contract(stockAddr, ERC20_ABI, provider);
          const held = await stock.balanceOf(addresses.agentVault);
          if (held === 0n) continue;
          const capShares = BigInt(Math.floor((vaultCap / sig.price) * 1e8));
          const amount = held < capShares ? held : capShares;
          logLine(`  vault agentSell ${sig.ticker} ${ethers.formatUnits(amount, 8)} shares (<=25% of vault)`);
          const tx = await vaultW.agentSell(id, amount);
          const rc = await tx.wait();
          executed.push({ type: 'vaultSell', ticker: sig.ticker, tx: rc.hash });
        }
      }
    } else {
      logLine(`  SKIP vault rebalance: vault totalAssets ${fmtUsd(totalAssetsUsd)} too small`);
    }
  } catch (err) {
    logLine(`  vault rebalance failed (non-fatal): ${err.shortMessage || err.message}`);
  }

  // Read back on-chain positions.
  const positions = { tusdc: Number(ethers.formatUnits(await tusdc.balanceOf(wallet.address), 6)), stocks: {} };
  for (const t of TICKERS) {
    const stockAddr = addresses.stockTokens?.[t] ?? (await market.stockToken(STOCK_IDS[t]));
    const stock = new ethers.Contract(stockAddr, ERC20_ABI, provider);
    positions.stocks[t] = Number(ethers.formatUnits(await stock.balanceOf(wallet.address), 8));
  }
  return { executed, positions };
}

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2);
  const wantLive = args.includes('--live');
  const wantDry = args.includes('--dry-run');
  const addresses = loadAddresses();
  const live = wantLive && addresses;

  if (wantLive && !addresses) {
    console.error('ERROR: --live requested but bot/addresses.json is missing (contracts not deployed yet).');
    console.error('Falling back to --dry-run. Deploy contracts first, then re-run with --live.');
  }
  const mode = live ? 'LIVE' : 'DRY-RUN';
  logLine(`=== Yuerta Stock Agent run (${mode}) — Base Sepolia 84532 ===`);

  // 1) Fetch prices + compute signals.
  const prevState = loadState();
  const signals = [];
  for (const t of TICKERS) {
    try {
      const closes = await fetchCloses(t);
      const sig = computeSignal(t, closes);
      signals.push(sig);
      logLine(`${t.padEnd(5)} ${fmtUsd(sig.price).padStart(10)}  SMA5 ${fmtUsd(sig.sma5)}  SMA20 ${fmtUsd(sig.sma20)}  RSI ${sig.rsi.toFixed(1).padStart(5)}  mom ${fmtPct(sig.momentum).padStart(7)}  -> ${sig.signal}`);
      await sleep(300); // be gentle with Yahoo
    } catch (err) {
      const prev = prevState?.prices?.[t];
      logLine(`${t.padEnd(5)} FETCH FAILED: ${err.message}${prev ? ` — keeping stale price ${fmtUsd(prev.price)} from ${prevState.timestamp}` : ''}`);
      if (prev) signals.push({ ...prev, signal: 'HOLD', reason: 'Price fetch failed; holding on stale data.', stale: true });
    }
  }
  if (signals.length === 0) {
    logLine('FATAL: no prices fetched at all. Aborting run.');
    process.exit(1);
  }

  const prices = {};
  for (const s of signals) prices[s.ticker] = { price: s.price, sma5: s.sma5, sma20: s.sma20, rsi: s.rsi, momentum: s.momentum, signal: s.signal, reason: s.reason };

  let positions;
  let pnlEstimate;
  let lastTrades = [];
  let onChain = null;

  if (live) {
    // Live mode only: load the testnet-only key. Never printed.
    const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const wallet = new ethers.Wallet(key.privateKey, provider);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID) throw new Error(`wrong chain ${net.chainId}, expected ${CHAIN_ID}`);
    logLine(`bot wallet ${wallet.address} (chain ${net.chainId}, Base Sepolia)`);
    const ethBal = await provider.getBalance(wallet.address);
    logLine(`bot ETH balance: ${ethers.formatEther(ethBal)} (gas only, testnet)`);
    const res = await runLive(addresses, signals, wallet, provider);
    onChain = res.executed;
    positions = res.positions;
    // PnL estimate vs paper seed is not meaningful live; report market value.
    const marketValue = positions.tusdc + TICKERS.reduce((sum, t) => sum + (positions.stocks[t] || 0) * (prices[t]?.price ?? 0), 0);
    pnlEstimate = { mode: 'live', portfolioValueUsd: marketValue, note: 'Live portfolio market value (tUSDC + stock at oracle price). No cost basis tracked on-chain yet.' };
    lastTrades = onChain.map((e) => ({ ...e, at: nowIso() }));
    for (const e of onChain) logLine(`  on-chain: ${e.type} ${e.ticker ?? ''} tx ${e.tx}`);
  } else {
    // Dry-run: paper portfolio, no wallet, no transactions.
    const portfolio = prevState?.paperPortfolio ?? { tusdc: PAPER_SEED_TUSDC, stocks: {} };
    for (const sig of signals) {
      const trade = paperTrade(portfolio, sig);
      if (trade.action !== 'HOLD') {
        logLine(`  [paper] ${trade.action} ${sig.ticker}: ${trade.detail}`);
        lastTrades.push({ type: trade.action, ticker: sig.ticker, detail: trade.detail, at: nowIso() });
      } else if (trade.action === 'SKIP') {
        logLine(`  [paper] SKIP ${sig.ticker}: ${trade.detail}`);
      }
    }
    positions = { tusdc: portfolio.tusdc, stocks: portfolio.stocks };
    const marketValue = portfolio.tusdc + TICKERS.reduce((sum, t) => sum + (portfolio.stocks[t] || 0) * (prices[t]?.price ?? 0), 0);
    pnlEstimate = {
      mode: 'paper',
      seedUsd: PAPER_SEED_TUSDC,
      portfolioValueUsd: marketValue,
      pnlUsd: marketValue - PAPER_SEED_TUSDC,
      pnlPct: (marketValue - PAPER_SEED_TUSDC) / PAPER_SEED_TUSDC,
    };
    logLine(`paper portfolio value ${fmtUsd(marketValue)} (seed ${fmtUsd(PAPER_SEED_TUSDC)}, PnL ${fmtUsd(pnlEstimate.pnlUsd)} / ${fmtPct(pnlEstimate.pnlPct)})`);
  }

  const state = {
    timestamp: nowIso(),
    mode,
    chainId: CHAIN_ID,
    prices,
    signals: signals.map((s) => ({ ticker: s.ticker, signal: s.signal, reason: s.reason })),
    positions,
    pnlEstimate,
    lastTrades: [...(prevState?.lastTrades ?? []).slice(-50), ...lastTrades],
    paperPortfolio: live ? prevState?.paperPortfolio ?? null : positions,
    onChainTxs: live ? onChain : [],
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  logLine(`state written to bot/state.json (${mode})`);
  logLine('=== run complete ===');
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  try { fs.appendFileSync(LOG_PATH, `[${nowIso()}] FATAL: ${err.message}\n`); } catch {}
  process.exit(1);
});
