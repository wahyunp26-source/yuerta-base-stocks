# Yuerta Stock Agent — bot

Autonomous rule-based trading bot for tokenized US stocks on **Base Sepolia
(84532)**. Part of the Base Stocks Maxxing hackathon project (Agentic Stock
Finance track). See `../docs/PLAN.md` for the frozen contract interface.

## Strategy (deterministic, no LLM, no paid APIs)

Per ticker, from Yahoo Finance daily closes (1 month):

- **5-day vs 20-day SMA crossover** + **14-day RSI** (Wilder) + **1-day momentum**
- **BUY** if 5d SMA > 20d SMA and RSI < 70
- **SELL** if 5d SMA < 20d SMA or RSI > 75
- else **HOLD**

Each signal carries a 1-sentence reason string, published on-chain with the
trade (`agentTrade(..., reason)`).

Tickers: AAPL, NVDA, MSFT, TSLA, AMZN, GOOGL, META, AMD.

## Setup

```bash
cd ~/workspace/hackathons/base-stocks
npm install          # ethers v6 (already in node_modules)
```

- Price source: Yahoo Finance chart API, no key:
  `GET https://query1.finance.yahoo.com/v8/finance/chart/<TICKER>?range=1mo&interval=1d`
- Bot key: `bot-key.json` (mode 600, testnet-only, Base Sepolia faucet ETH
  only). **Never print, commit, or share the private key.** It is only read
  in `--live` mode.
- Contract addresses: `bot/addresses.json` (created at deploy time):

```json
{
  "stockMarket": "0x...",
  "agentVault": "0x...",
  "tUSDC": "0x...",
  "stockTokens": { "AAPL": "0x...", "NVDA": "0x...", "...": "0x..." }
}
```

## Run

```bash
# Dry-run (default while addresses.json is missing): fetch prices, compute
# signals, paper-trade, write state. Sends NO transactions, needs no key.
node bot/agent.js --dry-run
# or
./bot/run.sh

# Live (requires addresses.json + funded bot key):
node bot/agent.js --live
```

Live mode, per run:

1. `StockMarket.setPrice` for all 8 tickers (oracle role).
2. `StockMarket.agentTrade` per signal — agent's own portfolio, cap
   1,000 tUSDC per trade, max 1 trade per ticker per run.
3. `AgentVault.agentBuy` / `agentSell` rebalancing — max 25% of vault per trade.

## Outputs

- `bot/state.json` — timestamp, prices, signals, positions, PnL estimate, last trades.
- `bot/trades.log` — append-only run log (also printed to stdout).

## Rules (hard)

- $0 spend. Testnet only. Never mainnet, never real money.
- Never print the private key. Never claim a prize / post to X as Wahyu.
- Testnet stocks are labeled TEST everywhere; they are not real securities.
