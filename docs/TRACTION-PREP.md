# TRACTION PREP — honest status + ready-to-post material

## Honest status (verified on-chain 17 Nov 2026, block 59,993,774)
- **External human traders: 0.** All 18 trades are the agent's own (12 BUYs of $1,000). Vault TVL $0, 0 shares, 0 depositors.
- **PLAN Week 1 goal (20+ traders, 100+ trades) is NOT met.** The product is live and working, but no humans have used it yet — no X launch post has gone out (Draft 1 was never posted; it needs the dApp link first).
- Do NOT claim traction that doesn't exist. The submission story is: working product + agent trading live daily + free mechanics built for traction; traction push starts the moment the dApp link is public.

## What is ready to post (needs Wahyu's account + dApp link)
1. **Draft 1 (launch)** — finalized in docs/X-POST-DRAFTS.md with real numbers. Post the day the dApp link exists.
2. **Draft 2b (week in numbers)** — postable the same week; needs no humans.
3. **Draft 4 (Base builder community post)** — for Base Discord / builder groups; post with Draft 1.
4. **Draft 2 (Agent vs Humans)** — ONLY after Season 1 has ≥1 human trader; template with placeholders, do not post early.

## Season 1 (leaderboard)
- Contract StockLeagueBadge (0xa73D1f5f6e378CFCf12473776a09B35d7dF65428) is deployed; `award(to, season)` is owner-only (parent/agent calls it).
- Season 1 has not been announced. Announcement draft (post with Draft 1):
  > 🏆 Season 1 of the Yuerta Stock League is OPEN — humans vs the agent, on Base Sepolia (free).
  > Claim 10,000 test USDC, trade 8 stocks, top PnL at the end of the week wins an on-chain badge.
  > The agent is already trading — come beat it. [dApp link] @buildonbase
- Week-1 winner: awarded after the first week with ≥1 human trader; if no humans trade, no badge is awarded (do not award to the agent itself or to empty addresses).

## Build-in-public ($6k prize track)
- Cadence: 1 thread/week with real numbers (trades, volume, portfolio, users). Drafts 1, 2b, 2 are the first three. Each post must tag @buildonbase.
- Metrics to report each week (from docs/verify-live.mjs): tradeCount, totalVolumeUsd, portfolio value, unique traders (count from Trade events — script does not yet count uniques; add before Week 2 post).

## What still needs Wahyu (traction)
- Posting Drafts 1 / 2b / 4 from @wahyunp17 (agent never posts as him).
- Saying yes to sharing the dApp publicly (unlocks the dApp link for all of the above + the video).
- Community posts in groups he belongs to (agent has no access to his groups).
