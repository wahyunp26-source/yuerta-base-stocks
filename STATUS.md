# STATUS — Base Stocks Maxxing Builder Quest 2026

**Project:** Yuerta Stock Agent — autonomous AI agent trading tokenized stocks on Base (testnet)
**Track:** Agentic Stock Finance (track 2)
**Team:** yuerta (solo) — email wahyunp26@gmail.com — prize wallet 0x19e205dCeDC1c98610A41c4f5A1F73f1FAAa2389
**Deadline:** 5 Dec 2026 (UTC) — submit = X post w/ video demo tagging @buildonbase + official form
**Workdir:** ~/workspace/hackathons/base-stocks/
**Cost so far:** $0 — everything free (testnet, faucet, free APIs)

## ✅ VERIFIED LIVE (15 Nov 2026, from official pages)
- Quest: base.org/stocksmaxxing — Nov 5 → Dec 5, 2026 UTC; $100,000+ prizes ($50k Base tracks + $48k partner + $6k build-in-public). Rules: base.org/stocksmaxxing/rules.
- Entry: (1) public X post with video demo tagging @buildonbase, (2) official submission form (Google Form linked as "Apply Now" on quest page), (3) any track-section requirements. One submission per track.
- Eligibility: 18+, not OFAC-sanctioned resident. Indonesia OK. Teams ≤5. Prize: USDC on Base to team rep; must reply within 7 days + pass verification.
- **Testnet explicitly allowed, NOT judged less favorably** (rules §5).
- Judging: panel scores vs criteria on Quest Page (weights set there). Research said 50% traction / 25% product / 25% build-in-public — the fetched quest page text did NOT show per-track weights; treat traction as the dominant factor (build-in-public prize exists separately, $6k).
- Partners: o1 Exchange, Bankr, Stonks Exchange, BaseStonk, Feel.cash, Hydrex.
- **Coinbase tokenized stocks = B20 precompile tokens, Base MAINNET only** (no testnet versions). Real trading needs real money → NOT used for execution. Reference data API works free, no key: https://api.coinbase.com/v1/tokenized-stocks (100+ tokens, e.g. AAPLc/NVDAc, B20 addresses 0xb200…).
- **B20 standard IS live on Base Sepolia** (since 18 Jun 2026) — but real Coinbase stocks don't exist there. Our testnet stocks are ERC-20 stand-ins, clearly labeled TEST (same pattern as other builders, e.g. bluechip project).
- Price data: Yahoo Finance chart API works free, no key (AAPL $356.27 live 15 Nov). Stooq timed out — fallback only. Chainlink feeds on Base mainnet cover 10 stocks; Sepolia has none → our oracle is bot-fed, labeled TEST_ONLY.

## ✅ DEPLOYED + LIVE — 15 Nov 2026 ~15:30 WIB
- **Faucet:** Google Sepolia faucet 0.05 ETH claimed to deployer (tx `0x5943cbeaeb6658d89999764e9c4d6fa73d50bfb58bcb696e30621e87b4f4cf39`). Alchemy + QuickNode faucets FAILED (mainnet-balance gate) — do not retry.
- **Bridge:** L1StandardBridge Sepolia `0xfd0Bf71F60660E2f608ed56e1659C450eB113120` (verified from docs.base.org + on-chain: l2TokenBridge()=0x4200…0010, messenger()=0xC34855F4…). `depositETH(200000, 0x)` 0.04 ETH, tx `0xc4bcacfc12570f41a59162476bf88bd09360cce820deefb3c2a9f8887d9e8b3f`, success. Relay took ~6 min; 0.04 ETH landed on Base Sepolia in full. 0.01 ETH kept on Sepolia.
- **Contracts deployed on Base Sepolia (84532):**
  - TestUSDC `0xc0149e09F100534631B352748bcD35B4ae0b9E67`
  - StockMarket `0x9A064AE9d8277841DD01210780e9085ECC64Db18`
  - AgentVault `0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD`
  - StockLeagueBadge `0xa73D1f5f6e378CFCf12473776a09B35d7dF65428`
  - sAAPL `0x97927B6Ab1E67Ea7857feA925a6350A4C3E10338` · sNVDA `0x6679c27465c3Fd4629a44367413d40D9649dcc8E` · sMSFT `0x26ee52a85AbB9D52E0Ecd372924936A3422426Ad` · sTSLA `0x4524045103021CceBa762f397D5b06EAC591ea2c` · sAMZN `0xe87F2BAa2a06A52Fc20699240B623762aDa73851` · sGOOGL `0x0A8500c6eFE6d39cFc67C3B24527fac5447b0fdB` · sMETA `0xA3b2fC6F1D6D59519B4daCAC486DF75489455818` · sAMD `0x1b4c7033063a0F2544ccb083A3bf015eECf73217`
  - Market seeded with 10,000 tUSDC (on-chain balance confirmed). Addresses in `bot/addresses.json` + `contracts/addresses.json`.
- **Bot LIVE — first run 15 Nov 15:29–15:30 WIB:** 8/8 `setPrice` txs confirmed on-chain (AAPL $356.27, NVDA $162.85, MSFT $523.88, TSLA $390.22, AMZN $266.66, GOOGL $295.77, META $641.69, AMD $534.06 — all re-read from chain and matching). Signals: BUY AAPL/TSLA/AMZN/AMD, SELL NVDA/MSFT/GOOGL/META. Agent trades SKIPPED: bot tUSDC = 0 (deployer already claimed at deploy; 24h cooldown → next claim ~15:30 WIB 16 Nov). Vault empty, rebalance skipped. Bot ETH left 0.0399 (gas only).
- **dApp LIVE:** artifact `yuerta-stock-agent` CONFIG updated with all 12 real addresses; "deploying soon" banner gone; market reads live oracle prices; faucet/trade/vault buttons target real contracts; builder verified every read path live (tUSDC 6dp, sAAPL 8dp, vault totalAssets 0 / NAV 1.0). **Interface corrections found on-chain (PLAN was wrong):** `price(uint8)` returns a SINGLE uint256 (public mapping; timestamp is separate `priceUpdatedAt(uint8)`); fee getter is `FEE_BPS()` = 30 (0.30%), NOT `feeBps()` (reverts) — dApp fixed accordingly.
- **Sourcify verification — ✅ RESOLVED 17 Nov ~20:04 WIB (retry): 12/12 VERIFIED `exact_match`** (creation + runtime) on Sourcify, 12/12 "Pass - Verified" on Blockscout. Old 15 Nov server-side blocker (`Failed fetching solc v0.8.28`) is gone. Standard JSON rebuilt from scratch and saved persistently at `contracts/standard.json` (25 sources; rebuild: `contracts/build-standard-json.js`); local pre-check `contracts/local-verify.js` (10/12 exact, StockMarket + AgentVault immutable-only, verified byte-by-byte). Full record: `docs/SOURCIFY-RETRY.md` + `docs/sourcify-retry-results.json`. ⚠️ **Remaining: Basescan (Etherscan) still likely unverified** — Sourcify's forward failed on its daily limit ("Daily limit of 500 source code submissions reached"). **Forward retry ATTEMPTED 17 Nov 13:33 UTC: re-submit returns HTTP 409 `already_verified` — Sourcify runs no new job for a verified contract, so the forward cannot be re-triggered; the 00:00 UTC reset does NOT unblock it.** Remaining path: direct Basescan verification (manual web form via browser, or an API key — needs Wahyu's word). Check script: `contracts/basescan-forward-check.js`.

## 📋 NEXT (needs parent / follow-up)
- **16 Nov ~15:30 WIB:** claim 10,000 tUSDC for bot wallet (24h cooldown ends), then run `node bot/agent.js --live` — agent trades start then. (Bot runs on cron every 4h per PLAN — cron NOT yet created; parent to create: `bot/run.sh --live`.)
- **✅ CLAIM + LIVE RUN DONE 16 Nov 15:35–15:36 WIB:** claim 10,000 tUSDC tx `0xafaf5275b0850d8b4b99d81647f2499e1a36e87cc573654d66d9aa671db02e10` (block 59481326). Bot live run: 8/8 setPrice confirmed; 4 BUY agentTrade executed @ 1,000 tUSDC each — AAPL `0x179bc66a…`, TSLA `0x655dabd7…`, AMZN `0xddfa4a9b…`, AMD `0x1f4f69d4…`; 4 SELL skipped (no position: NVDA/MSFT/GOOGL/META); vault rebalance skipped (vault empty). Bot tUSDC now 6,000; next claim ~17 Nov 15:35 WIB.
- **✅ CLAIM + LIVE RUN DONE 17 Nov 15:35–15:36 WIB:** cooldown ended 15:35:34 WIB (verified on-chain, lastClaim 16 Nov 15:35:34 WIB). Claim 10,000 tUSDC tx `0x3e414d20e32666486392c5d7b2086d8d08cbf0d1dfc3a480904b28c519560250` (block 59913403). Bot live run: 8/8 setPrice confirmed; 4 BUY agentTrade @ 1,000 tUSDC each — AAPL `0x2abf379e…`, TSLA `0x1e2ced68…`, AMZN `0xa378a31a…`, AMD `0xff4810a6…`; 4 SELL skipped (no position). Positions now: tUSDC 6,000 • AAPL 11.24 • TSLA 10.35 • AMZN 11.35 • AMD 5.71 saham; portfolio ~$19,697. Vault still empty. Next claim ~18 Nov 15:35 WIB.
- ~~Retry Sourcify verification with saved `/tmp/standard.json` once their solc fetch works.~~ ✅ DONE 17 Nov ~20:04 WIB — 12/12 exact_match (see docs/SOURCIFY-RETRY.md). Basescan forward retry ATTEMPTED 17 Nov 13:33 UTC — blocked by HTTP 409 `already_verified`; direct Basescan verification is the only remaining path (browser form or API key).
- Demo video + X post draft (drafts in docs/X-POST-DRAFTS.md) + official form before 5 Dec 2026.

## ✅ SUBMISSION PREP — 17 Nov 2026 ~20:05 WIB (Wahyu: "siapkan dulu semua, kalau udah baru aku bantu urus")
- **Live verification DONE (block 59,993,774):** prices fresh (0.5h), fee 30bps, totalVolume $18,000, tradeCount 18, bot tUSDC 2,000 + ETH 0.0399, portfolio ~$19,685, vault $0 TVL / 0 shares. Script: docs/verify-live.mjs (fixed: `price()` returns a SINGLE uint256; timestamp via `priceUpdatedAt()`).
- **Form fields extracted from the live Google Form (17 Qs):** Project name, Full name, Email, X Handle, 1-2 sentence description, Current stage (Idea/Prototype/Live product → Live product), token? (Yes/No → No), Entry type (Build New / Level Up → Build New), Intended track (→ Agentic Stock Finance), partners multi-select (→ None), support needed, demo URL, why select you, 3 consents, Telegram groups. Form title: "Stocks Maxxing | Register + Partner Support". All answers pre-filled in docs/SUBMISSION-PREP.md.
- **Docs written:** docs/SUBMISSION-PREP.md (all 17 answers + links + contracts + metrics), docs/X-POST-DRAFTS.md (Draft 1 launch + 2b week-in-numbers finalized with real numbers; Draft 2 agent-vs-humans TEMPLATE ONLY — 0 human traders yet; Draft 3 submission post; Draft 4 community post), docs/VIDEO-SCRIPT.md (≤3 min script + 9-shot list), docs/TRACTION-PREP.md (honest status: 0 external traders, Week 1 goal unmet; Season 1 announcement draft).
- **Sourcify retry:** ✅ DONE 17 Nov ~20:04 WIB — 12/12 exact_match (docs/SOURCIFY-RETRY.md). Remaining: Basescan forward failed (Sourcify daily limit) — needs API key or retry after reset.
- **✅ BLOCKERS CLEARED 17 Nov ~20:35 WIB:** (1) dApp shared publicly by Wahyu 20:29 WIB — https://muse.ai/s/yuerta-stock-agent-xnxo6q7yxrqxvrd/pNTHzaUaih6Aym10PsOGmndua-wj4qxCgSHo7xmeEeM (video recording running). (2) Public GitHub repo CREATED + pushed: https://github.com/wahyunp26-source/yuerta-base-stocks (32 files, no secrets; README + docs updated with repo + dApp links). (3) Full legal name given 20:31 WIB: **Wahyu Nur Prasetyo** — filled into SUBMISSION-PREP.md Q2. (4) Wahyu posts the X post + files the form himself, only after prep is complete.
- **⏳ REMAINING (minor):** Basescan direct verification (manual web form or API key — needs Wahyu's word); demo video finishing (separate worker). Nothing filed/posted/claimed.

## ⚠️ KEY DECISION — needs parent awareness (not a blocker)
- **baw does NOT support Base Sepolia (84532).** Supported: 8453 Base mainnet, 56, 1, 137, 4663, Solana, 42161. Agent wallet cannot sign testnet txs via baw.
- **Solution (free, $0):** fresh testnet-only deployer/bot keypair generated locally for Base Sepolia (faucet ETH only, no real value). Address: 0xdd18DCC839338fA36643b1656b5829dc015A9408 (private key in `bot-key.json`, mode 600, NEVER in chat). Contracts' operational owner = this bot key (the agent wallet cannot sign on Sepolia at all, so owner-only functions would be dead otherwise); prize wallet in the form = 0x19e2…. Identity/prize never uses another wallet.
- **BLOCKER — Still needed:** ~0.05 test ETH on Base Sepolia for deployment + bot gas. Tried: Triangle faucet (503), pk910 PoW faucet (JS-only page, API not reachable via curl). **Needs parent browser help:** claim from Alchemy Base Sepolia faucet for 0xdd18DCC839338fA36643b1656b5829dc015A9408.

## 🏗️ PRODUCT — Yuerta Stock Agent
Autonomous AI agent + copy-trading vault for tokenized stocks on Base Sepolia. Users play free:
- **Faucet tUSDC** (claim 10,000/day) → **buy/sell 8 tokenized stocks** (sAAPL, sNVDA, sMSFT, sTSLA, sAMZN, sGOOGL, sMETA, sAMD) at oracle prices via on-chain market maker (0.3% fee).
- **Agent trades on-chain too** (own portfolio + vault), publishing every decision + reasoning on-chain.
- **AgentVault copy-trading:** deposit tUSDC → agent trades for you, pro-rata shares, NAV on-chain.
- **Leaderboard:** weekly season, humans vs agent, on-chain badge for winners.
- **Frontend:** live dApp (Space artifact) reading all state from Base Sepolia RPC; wallet connect (MetaMask/Base), claim/trade/deposit in-browser.

## 📅 TIMELINE
- 15 Nov: verification + plan + contracts written (today)
- 16–17 Nov: deploy Sepolia, test trades, bot v1 live
- 18–20 Nov: frontend live, traction push (faucet, leaderboard, badge)
- 21–30 Nov: bot tuning, season 1, build-in-public X drafts
- 1–4 Dec: final polish, demo video, X post draft, submit form
- 5 Dec: SUBMIT before deadline

## 📍 MILESTONES
- [x] Live verification (15 Nov)
- [x] Contracts written + compiled (15 Nov — TestUSDC, StockToken ×8, StockMarket, AgentVault, StockLeagueBadge)
- [x] Bot v1 built + dry-run with real Yahoo prices (15 Nov — 4 BUY / 4 SELL signals, paper PnL −0.24% fees only)
- [x] Deployed on Base Sepolia (15 Nov ~15:28 WIB — all 12 contracts; bridge tx `0xc4bcacfc12570f41a59162476bf88bd09360cce820deefb3c2a9f8887d9e8b3f`)
- [x] Bot v1 live on-chain (15 Nov 15:29 WIB — 8/8 setPrice confirmed; agent trades start after tUSDC claim ~15:30 WIB 16 Nov)
- [x] Frontend dApp live (artifact `yuerta-stock-agent` CONFIG updated with real addresses 15 Nov ~15:31 WIB, builder-verified reads; trading active)
- [ ] Demo video + X post draft (drafts ready in docs/X-POST-DRAFTS.md)
- [ ] Submission form filed (proof here)

## 📄 FILES
- docs/PLAN.md — build plan + traction plan + frozen contract interface
- contracts/ — Solidity sources + deploy scripts (solc-js + ethers v6)
- bot/ — agent trader (Node.js)
- app/ — frontend dApp source
- video/ — demo video assets
