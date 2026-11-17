# SUBMISSION PREP — Base Stocks Maxxing Builder Quest 2026

**Status: READY TO FILE except the items marked ⏳ below. DO NOT file without Wahyu — he files from his account.**
**Form:** https://docs.google.com/forms/d/1zotYvkeAtDjR2MKk3qNxyNIAfJ_IPQtzTtjNhOAF8js/viewform ("Stocks Maxxing | Register + Partner Support")
**Quest page:** https://base.org/stocksmaxxing — **Deadline: 5 Dec 2026.** Form text says "Ends December 5, 2026, 11:59pm EST" (= 6 Dec 04:59 UTC); STATUS.md says 23:59 UTC. **Working deadline: 5 Dec 23:59 UTC (earlier = safer).**
**How to file:** Wahyu opens the form, pastes the answers below, ticks the consents, submits. Then save the confirmation + X post link in STATUS.md.

## Team
- Project: **Yuerta Stock Agent** — Agentic Stock Finance track
- Team: **yuerta (solo)** — Wahyu, wahyunp26@gmail.com, X @wahyunp17
- Prize wallet: **0x19e205dCeDC1c98610A41c4f5A1F73f1FAAa2389** (agent EVM wallet; USDC on Base)
- ✅ Full name: **Wahyu Nur Prasetyo** (given 17 Nov 20:31 WIB).

## Pre-filled form answers (17 questions, verified from the live form 17 Nov 2026)
| # | Question | Answer to paste |
|---|---|---|
| 1 | Project name | Yuerta Stock Agent |
| 2 | Full name | ✅ Wahyu Nur Prasetyo |
| 3 | Email address | wahyunp26@gmail.com |
| 4 | X Handle | @wahyunp17 |
| 5 | Describe your project in 1-2 sentences | Yuerta Stock Agent is an autonomous AI agent that trades tokenized US stocks on Base Sepolia and lets anyone copy-trade it or compete against it — free to play with faucet test USDC, a weekly leaderboard, and every trade plus its reasoning published on-chain. |
| 6 | Current stage | **Live product** (options: Idea / Prototype / Live product) |
| 7 | Does your project have a token? | **No** (no launched token; testnet sTOKENS are stand-ins, not a token launch) |
| 8 | Entry type | **Build New — you want to launch a new tokenized stock product on Base. A token is optional.** |
| 9 | Intended Base track | **Agentic Stock Finance** |
| 10 | Launch partners you want to consider working with | **None** (no partner work done yet — honest; change only if a partner conversation starts) |
| 11 | What support is most valuable for you? | Distribution and visibility to Base builders and stock-trading users — help getting real testers onto the free testnet league (faucet + leaderboard). No partner integration work done yet; open to it. |
| 12 | Product or demo URL, if available | ⏳ dApp link — pending artifact share (see blockers). Paste the public dApp URL here. Also paste the X submission-post URL after Wahyu posts it (form has no dedicated X-post field; put both links here, dApp first). |
| 13 | Why should we select you to be a part of Stocks Maxxing? | Working product, live on testnet since 15 Nov: an autonomous agent trading 8 tokenized stocks on-chain every 4 hours with published reasoning (18 trades, $18,000 volume, portfolio ~$19,685 — all verifiable on Sepolia Basescan). Free-to-play mechanics (10,000 tUSDC/day faucet, copy-trading vault with on-chain NAV, weekly leaderboard with on-chain winner badges) are built to drive real, verifiable on-chain activity. Built solo in three weeks, $0 spent. |
| 14 | May we collect, store and share your contact, project details and support request? | Yes (Wahyu ticks at filing) |
| 15 | You have read the Official Rules and Conditions | Yes (Wahyu ticks at filing) |
| 16 | You agree to the following conditions | Yes (Wahyu ticks at filing) |
| 17 | Join the Telegram Group with partners | Optional — partner group links are on the form; only relevant if a partner is selected in Q10 (currently None). |

## Links (for the form + X post)
- ⏳ **dApp (demo) URL: PENDING — artifact `yuerta-stock-agent` is NOT shared publicly yet.** Wahyu must say yes to sharing it (artifact.share), then paste the public URL here + in the X post.
- ✅ **Code repo URL: https://github.com/wahyunp26-source/yuerta-base-stocks** (public, created + pushed 17 Nov ~20:35 WIB; 32 files, no secrets — `.gitignore` excludes `bot-key.json`, `node_modules/`, `out/`, `.env`).
- Quest: https://base.org/stocksmaxxing — Rules: https://base.org/stocksmaxxing/rules
- Basescan (all contracts): https://sepolia.basescan.org/address/0x9A064AE9d8277841DD01210780e9085ECC64Db18 (StockMarket; links to the rest)

## Contracts (Base Sepolia, chain 84532)
| Contract | Address |
|---|---|
| TestUSDC (tUSDC, 6dp) | 0xc0149e09F100534631B352748bcD35B4ae0b9E67 |
| StockMarket | 0x9A064AE9d8277841DD01210780e9085ECC64Db18 |
| AgentVault | 0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD |
| StockLeagueBadge | 0xa73D1f5f6e378CFCf12473776a09B35d7dF65428 |
| sAAPL / sNVDA / sMSFT / sTSLA | 0x97927B6A…10338 / 0x6679c274…dcc8E / 0x26ee52a8…42Ad / 0x45240451…1ea2c |
| sAMZN / sGOOGL / sMETA / sAMD | 0xe87F2BAa…38551 / 0x0A8500c6…b0fdB / 0xA3b2fC6F…5818 / 0x1b4c7033…3217 |

## Live metrics (verified on-chain 17 Nov 2026 ~20:03 WIB, block 59,993,774)
- Oracle prices fresh (0.5h old): AAPL $352.78, NVDA $156.14, MSFT $517.99, TSLA $379.74, AMZN $257.75, GOOGL $283.72, META $626.41, AMD $504.28
- Agent portfolio ~$19,685 (tUSDC 2,000 + AAPL 14.06 + TSLA 12.97 + AMZN 15.21 + AMD 7.69)
- 18 on-chain trades, $18,000 total volume (12 agent BUYs of $1,000 each; 0 sells — no positions to sell yet)
- Bot gas: 0.0399 ETH (Sepolia test ETH, fine for weeks of 4h runs)
- Vault: $0 TVL, 0 shares — copy-trading has no depositors yet (honest; do not claim otherwise)
- Traction: all 18 trades are the agent's own; **0 external human traders so far** (see TRACTION-PREP.md)

## Filing checklist for Wahyu (after prep is complete)
- [ ] Say yes to sharing the dApp publicly → paste public URL into Q12 + X post
- [x] Full legal name for Q2: Wahyu Nur Prasetyo
- [ ] Post the submission X post (Draft 3 in X-POST-DRAFTS.md) with the video attached, tagging @buildonbase
- [ ] File this form with the answers above + X post URL in Q12
- [ ] Save the form confirmation + X post link in STATUS.md
