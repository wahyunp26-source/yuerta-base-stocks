# DEMO VIDEO — script + shot list (Yuerta Stock Agent)

**Target: ≤3 min, 1280×720, mp4. Record the LIVE dApp. Status 17 Nov 2026: SCRIPT READY — recording BLOCKED until the dApp artifact (`yuerta-stock-agent`) is shared publicly (needs Wahyu's yes; currently share.shared=false, no public URL).**
**Once the public URL exists:** screenshot each shot with headless Chrome (`/opt/meta-chromium/chrome --headless=new --screenshot --window-size=1280,720 <url>`), then assemble with ffmpeg (see `video/assemble.sh` — to be created at record time; pattern: 3s stills + title cards + captions, 30fps, libx264).

## Narration (read aloud while recording; total ~2:45)
1. (0:00–0:15, title card) "Yuerta Stock Agent — an autonomous AI agent trading tokenized stocks on Base. Free to play, testnet only."
2. (0:15–0:45, market view) "Eight testnet stocks — Apple, Nvidia, Microsoft, Tesla, Amazon, Alphabet, Meta, AMD — priced by a live on-chain oracle, updated every four hours from real market data."
3. (0:45–1:15, faucet + buy) "Anyone can claim ten thousand test USDC a day from the faucet — free — and buy in one click. Every trade settles on-chain."
4. (1:15–1:45, agent feed) "The agent trades too — and publishes every decision with its reasoning on-chain. Twelve buys so far, eighteen trades total, eighteen thousand dollars of volume."
5. (1:45–2:15, vault) "Copy-trade it: deposit into the vault and the agent trades for you. Net asset value is on-chain, pro-rata shares."
6. (2:15–2:45, leaderboard + Basescan) "Weekly seasons, humans versus agent, winner badges on-chain. Everything is verifiable on Sepolia Basescan."
7. (2:45–3:00, outro card) "Yuerta Stock Agent — built for the Base Stocks Maxxing Builder Quest. Free to play."

## Shot list (each a real render of the live dApp — never edited, never mocked)
| # | Shot | What must be visible |
|---|---|---|
| 1 | Title card | "Yuerta Stock Agent" + "Base Sepolia • Testnet" + quest name |
| 2 | Market table | All 8 stocks with live oracle prices + Buy/Sell buttons |
| 3 | Faucet claim | Claim button + tUSDC balance (10,000/day) |
| 4 | A buy | Buy sAAPL flow / confirmation (real tx if possible; else the market + a recent AgentTrade) |
| 5 | Agent feed | Latest AgentTrade entries with reasons (AAPL/TSLA/AMZN/AMD BUYs) |
| 6 | Vault | totalAssets + navPerShare + Deposit/Withdraw (note: $0 TVL so far — show it honestly) |
| 7 | Leaderboard | Season view / badge (if empty, show the season panel as-is) |
| 8 | Basescan proof | StockMarket page: tradeCount 18, volume $18,000, recent txs |
| 9 | Outro card | dApp link + X @wahyunp17 + @buildonbase |

## Live numbers to show (verified 17 Nov 2026, block 59,993,774)
- Prices: AAPL $352.78, NVDA $156.14, MSFT $517.99, TSLA $379.74, AMZN $257.75, GOOGL $283.72, META $626.41, AMD $504.28
- Portfolio ~$19,685 · 18 trades · $18,000 volume · fee 0.3% · faucet 10,000 tUSDC/day
- Contracts: StockMarket 0x9A064AE9d8277841DD01210780e9085ECC64Db18

## Honesty rules
- Show the vault at $0 TVL as-is; do not claim depositors that don't exist.
- All footage is the real dApp + real chain data. No staged balances, no fake users.
- Testnet labels stay visible in every shot.
