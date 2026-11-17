# BUILD PLAN — Yuerta Stock Agent (Base Stocks Maxxing, Agentic Stock Finance)

## 1. Concept (one line)
An autonomous AI agent that trades tokenized US stocks on Base Sepolia — fully on-chain, free to use — and lets anyone copy-trade it or compete against it.

## 2. Why this wins
- **Traction (dominant weight):** $0 to play. Faucet tUSDC + 1-click trading + weekly leaderboard + winner badge = real on-chain users/transactions, all verifiable on Basescan. No real money needed from anyone.
- **Agentic (track fit):** the agent doesn't just display prices — it holds a portfolio, executes trades on-chain, publishes its reasoning on-chain, and manages other people's money via the vault. Programs interacting with tokenized equities = the track definition.
- **Real data:** prices from Yahoo Finance (free, no key) for the 8 underlying stocks; token list/metadata from Coinbase's official Tokenized Stocks API. Testnet stocks mirror real Coinbase tickers (AAPLc → sAAPL etc.), clearly labeled TEST.
- **Build-in-public ($6k prize):** weekly X threads with real numbers (trades, PnL, users), all drafts prepared for Wahyu.

## 3. FROZEN CONTRACT INTERFACE (bot + frontend code against this)
Chain: Base Sepolia (84532). RPC: https://sepolia.base.org. Explorer: https://sepolia.basescan.org.
Decimals: tUSDC 6, stock tokens 8, prices USD with 8 decimals (e.g. $356.27 = 35627000000).
Stock IDs: 0=AAPL, 1=NVDA, 2=MSFT, 3=TSLA, 4=AMZN, 5=GOOGL, 6=META, 7=AMD.

### TestUSDC (tUSDC) — ERC20
- `claim()` — mints 10,000 tUSDC (10_000 * 1e6) to caller, max once per 24h per address. Emits `Claim(address,uint256)`.
- `decimals()` = 6. Owner = deployer (only for emergencies; no mint backdoor for users beyond claim).

### StockToken (sAAPL … sAMD) — ERC20, 8 decimals
- `mint(address,uint256)` / `burn(address,uint256)` — only StockMarket.
- 8 separate deployments, one per ticker. Symbol: sAAPL etc. Name: "Yuerta Test AAPL" etc. — TEST label in name.

### StockMarket
- `tUSDC()` → address. `stockToken(uint8 id)` → address. `price(uint8 id)` → (uint256 priceUsd8, uint256 updatedAt).
- `feeBps()` = 30 (0.3%).
- `setPrice(uint8 id, uint256 priceUsd8)` — only oracle (bot) address. Emits `PriceUpdated(id, price, updatedAt)`.
- `buy(uint8 id, uint256 usdcAmount)` — caller must approve tUSDC first. Stock out = usdcAmount * 1e8 / price * (10000 - feeBps) / 10000. Emits `Trade(msg.sender, id, true, usdcAmount, stockOut, price)`.
- `sell(uint8 id, uint256 stockAmount)` — burns stock, pays tUSDC = stockAmount * price / 1e8 * (10000 - feeBps) / 10000. Emits `Trade(msg.sender, id, false, stockAmount, usdcOut, price)`.
- `agentTrade(uint8 id, bool isBuy, uint256 amount, string calldata reason)` — only agent (bot) address; same math, but the traded funds come from/go to the AGENT's own balance (agent must approve/hold). Emits `AgentTrade(id, isBuy, amount, out, price, reason)`.
- `totalVolumeUsd()` (accumulated, 6dp) and `tradeCount()` views.
- Staleness guard: trades revert if price older than 48h.
- `owner()` = agent wallet 0x19e205dCeDC1c98610A41c4f5A1F73f1FAAa2389. `oracle()` / `agent()` = bot address (set at deploy, changeable by owner).

### AgentVault (copy-trading)
- `deposit(uint256 usdcAmount)` — mints shares = usdcAmount * totalShares / totalAssets (or 1:1 if empty). Emits `Deposit`.
- `withdraw(uint256 shares)` — burns shares, pays tUSDC pro-rata. Emits `Withdraw`.
- `agentBuy(uint8 id, uint256 usdcAmount)` / `agentSell(uint8 id, uint256 stockAmount)` — only agent; trades vault funds via StockMarket. Emits `VaultTrade`.
- `totalAssets()` — tUSDC balance + Σ stock balances × oracle price. `navPerShare()` — 6dp.
- `owner()` = agent wallet; `agent()` = bot address.

### StockLeagueBadge — ERC721
- `award(address to, uint256 season)` — only owner (parent/agent). TokenURI: on-chain JSON with season + rank. Awarded to weekly leaderboard winners.

## 4. Bot (Node.js, `bot/`)
Runs on cron (every 4h, 07:00–23:00 WIB + once daily outside market hours for price sync).
Each run:
1. Fetch Yahoo chart API for 8 tickers (1mo daily bars). Compute: 5d vs 20d SMA crossover + 14d RSI proxy + 1d momentum.
2. Decide per ticker: BUY / SELL / HOLD with a 1-sentence reason (rule-based, deterministic — no LLM API key needed, no cost).
3. Push prices to StockMarket.setPrice (all 8, batched).
4. Execute agent trades: agent portfolio (fixed test budget, e.g. 5,000 tUSDC seed from faucet claims) + vault rebalancing per signals (max 25% of vault per trade, max 1 trade per ticker per run).
5. Write `bot/state.json` (positions, PnL, last signals, trade log) + append to `bot/trades.log`.
6. Never spend real money; never touch mainnet; testnet key only.

## 5. Frontend dApp (Space artifact, `app/`)
- Connect wallet (MetaMask / Base wallet, Base Sepolia). Reads all state via eth_call to sepolia.base.org (CORS-friendly public RPC).
- Views: market (8 stocks, live oracle price, 24h change from Yahoo), agent portfolio + reasoning feed (from on-chain AgentTrade events via eth_getLogs, fallback: bot state file), vault (deposit/withdraw, NAV/share), leaderboard (top traders by realized PnL from Trade events), faucet claim button.
- All actions are real on-chain txs the user signs. No backend, no server, no cost.

## 6. TRACTION PLAN (50% of score — the whole game)
Week 1 (16–22 Nov): launch + faucet. X thread #1 (project intro + demo link), post in Base builder community (draft for Wahyu). Goal: 20+ unique traders, 100+ trades.
Week 2 (23–29 Nov): Season 1 leaderboard opens; X thread #2 (agent vs humans, real PnL numbers); badge for week-1 winner. Goal: 50+ traders, 300+ trades.
Week 3 (30 Nov–5 Dec): Season 1 closes, winner announced on X; final push; submit. Goal: 100+ traders, 1,000+ trades, vault TVL (testnet) > $50k tUSDC.
Mechanics that drive transactions: daily faucet (return visits), leaderboard (competition), agent copy-trading (deposit = tx), weekly seasons (fresh start = re-engagement). Every metric is verifiable on Basescan — link it in the submission.
Honest note: traction is testnet usage by real humans; no fake wallets, no wash trading, no bots farming our own leaderboard.

## 7. Submission checklist (before 5 Dec 23:59 UTC)
- [ ] Contracts deployed + verified on Sepolia Basescan (source posted)
- [ ] Frontend live (public URL) + README with setup
- [ ] Bot running on schedule with public trade log
- [ ] Demo video (≤3 min) recorded from the live app
- [ ] X post published by Wahyu: video + tag @buildonbase + demo link
- [ ] Official Google Form filed with X post link + track "Agentic Stock Finance"
- [ ] Proof saved in STATUS.md

## 8. Rules (hard)
- $0 spend. No real tokens, no mainnet txs, no top-ups without parent approval.
- Never claim a prize without Wahyu's word. Never post to X as Wahyu.
- Testnet stocks are labeled TEST everywhere; never imply they are real Coinbase securities or give rights in the underlying companies.
