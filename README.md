# Yuerta Stock Agent

**An autonomous AI agent that trades tokenized US stocks on Base — and lets anyone copy-trade it or compete against it. Free to play on Base Sepolia testnet.**

Entry for the [Base Stocks Maxxing Builder Quest 2026](https://base.org/stocksmaxxing) — **Agentic Stock Finance** track. Deadline: 5 Dec 2026.

- 🌐 Live demo: [Yuerta Stock Agent dApp](https://muse.ai/s/yuerta-stock-agent-xnxo6q7yxrqxvrd/pNTHzaUaih6Aym10PsOGmndua-wj4qxCgSHo7xmeEeM)
- 📜 Contracts: Base Sepolia (chain 84532) — all 12 contracts Sourcify-verified (`exact_match`), also "Pass - Verified" on Blockscout. Full list below; also in `contracts/addresses.json`.
- 🐦 Build in public: [@wahyunp17](https://x.com/wahyunp17) tagging [@buildonbase](https://x.com/buildonbase)

## What it is

An AI agent runs a transparent, on-chain stock-trading league for tokenized stocks:

1. **Faucet** — anyone claims 10,000 test USDC (tUSDC) per day, free.
2. **Market** — buy/sell 8 testnet tokenized stocks (sAAPL, sNVDA, sMSFT, sTSLA, sAMZN, sGOOGL, sMETA, sAMD) at oracle prices via an on-chain market maker (0.3% fee).
3. **Agent** — an autonomous bot reads real public stock prices (Yahoo Finance, free), computes momentum signals (5d/20d SMA + RSI), and trades on-chain from its own portfolio — publishing every decision and its reasoning on-chain.
4. **Vault** — deposit tUSDC and the agent trades it for you (pro-rata shares, NAV on-chain).
5. **League** — weekly seasons, humans vs agent, on-chain badge for winners.

## Why testnet?

Coinbase's real tokenized stocks (B20 tokens) exist only on Base mainnet and cost real money. The quest rules explicitly allow testnet builds with no judging penalty — so the whole league runs on Base Sepolia with free faucet funds. The testnet stocks are clearly-labeled stand-ins; they are not real securities and give no rights in any underlying company.

## Contracts (`contracts/`) — deployed on Base Sepolia (84532)

| Contract | Address |
|---|---|
| TestUSDC | `0xc0149e09F100534631B352748bcD35B4ae0b9E67` |
| StockMarket | `0x9A064AE9d8277841DD01210780e9085ECC64Db18` |
| AgentVault | `0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD` |
| StockLeagueBadge | `0xa73D1f5f6e378CFCf12473776a09B35d7dF65428` |
| sAAPL | `0x97927B6Ab1E67Ea7857feA925a6350A4C3E10338` |
| sNVDA | `0x6679c27465c3Fd4629a44367413d40D9649dcc8E` |
| sMSFT | `0x26ee52a85AbB9D52E0Ecd372924936A3422426Ad` |
| sTSLA | `0x4524045103021CceBa762f397D5b06EAC591ea2c` |
| sAMZN | `0xe87F2BAa2a06A52Fc20699240B623762aDa73851` |
| sGOOGL | `0x0A8500c6eFE6d39cFc67C3B24527fac5447b0fdB` |
| sMETA | `0xA3b2fC6F1D6D59519B4daCAC486DF75489455818` |
| sAMD | `0x1b4c7033063a0F2544ccb083A3bf015eECf73217` |

All 12 verified on Sourcify (`exact_match`, creation + runtime) — see `docs/SOURCIFY-RETRY.md`.

| Contract | Purpose |
|---|---|
| `TestUSDC` | Faucet ERC-20 (6dp), 10,000 tUSDC / 24h per wallet |
| `StockToken` (×8) | Testnet tokenized stocks (8dp), mintable only by the market |
| `StockMarket` | Vault market maker, oracle prices, 0.3% fee, agent trades with on-chain reasoning |
| `AgentVault` | Copy-trading vault (6dp shares, NAV on-chain) |
| `StockLeagueBadge` | ERC-721 weekly winner badge |

Build: `node contracts/compile.js` (solc-js + OpenZeppelin). Deploy: `node contracts/deploy.js` (needs a funded Base Sepolia key in `bot-key.json` — testnet only).

## Bot (`bot/`)

Node.js, ethers v6, no paid APIs. `node bot/agent.js --dry-run` prints signals without sending transactions; `--live` updates oracle prices and executes agent + vault trades. See `bot/README.md`.

## Architecture

```
Yahoo Finance (free) → bot signals → StockMarket.setPrice (oracle)
                                            ↓
Users (faucet tUSDC) → buy/sell sSTOCKS ←→ Agent (own portfolio + vault)
                                            ↓
                                   Leaderboard + badges (on-chain events)
```

## Traction plan

- Week 1: launch + faucet, X thread #1. Goal: 20+ traders, 100+ trades.
- Week 2: Season 1 leaderboard, X thread #2. Goal: 50+ traders, 300+ trades.
- Week 3: Season 1 closes, winner announced, submit. Goal: 100+ traders, 1,000+ trades.

All metrics verifiable on [Sepolia Basescan](https://sepolia.basescan.org). No fake wallets, no wash trading.

## Disclaimer

Testnet only. No real value. Not affiliated with Coinbase or Base. Test stocks are not securities and do not represent ownership in any public company.
