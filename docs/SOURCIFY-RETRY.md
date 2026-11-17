# Sourcify Verification — RETRY (17 Nov 2026, ~20:04 WIB)

**Result: 12/12 VERIFIED ✅ — `exact_match` on Sourcify (creation + runtime).**
Also 12/12 "Pass - Verified" on Blockscout. The 15 Nov server-side blocker is GONE.

## What changed vs 15 Nov

- 15 Nov: Sourcify server could not fetch the solc binary —
  `compiler_error: Failed fetching solc v0.8.28 for platform bin`. Job failed after submission.
- 17 Nov retry: all 12 jobs compiled server-side in 175–417 ms. No solc-fetch error anywhere.
- The old `/tmp/standard.json` was lost on VM replacement — rebuilt from scratch and saved
  persistently at `contracts/standard.json` (25 sources: 5 local + 20 OpenZeppelin, resolved
  transitively). Rebuild script: `contracts/build-standard-json.js`.
  Compiler: solc `0.8.28+commit.7893614a`, optimizer enabled, runs 200 — same as deploy.

## Local pre-check (before submitting)

`contracts/local-verify.js` — compiled deployedBytecode vs on-chain runtime code (Base Sepolia RPC):

- 10/12 EXACT byte-for-byte match: TestUSDC, all 8 StockTokens, StockLeagueBadge.
- StockMarket + AgentVault: same length, differing bytes ONLY at immutable slots — every
  differing window verified to be exactly the immutable addresses (`tusdc` =
  `0xc0149e09F100534631B352748bcD35B4ae0b9E67`; `market` =
  `0x9A064AE9d8277841DD01210780e9085ECC64Db18`). Expected, not a mismatch.

## Per-contract verdicts

Endpoint: `POST https://sourcify.dev/server/v2/verify/84532/{address}` with JSON body
`{ stdJsonInput, compilerVersion: "0.8.28+commit.7893614a", contractIdentifier }`.
All 12 submissions returned HTTP 202. Match confirmed via the authoritative
`GET /v2/contract/84532/{address}` endpoint afterwards.

| Contract | Address | verificationId | Sourcify | Blockscout |
|---|---|---|---|---|
| TestUSDC | `0xc0149e09F100534631B352748bcD35B4ae0b9E67` | `8e49e6af-0488-4fb7-88b2-0e6369e23be9` | exact_match | Pass - Verified |
| StockToken-AAPL | `0x97927B6Ab1E67Ea7857feA925a6350A4C3E10338` | `c038021c-1b9c-4efc-be57-de41a65e1488` | exact_match | Pass - Verified |
| StockToken-NVDA | `0x6679c27465c3Fd4629a44367413d40D9649dcc8E` | `122e74b6-c66f-423d-ae19-104c9812c08b` | exact_match | Pass - Verified |
| StockToken-MSFT | `0x26ee52a85AbB9D52E0Ecd372924936A3422426Ad` | `d6f86ce3-9247-4376-b1e2-c6e133b8d24e` | exact_match | Pass - Verified |
| StockToken-TSLA | `0x4524045103021CceBa762f397D5b06EAC591ea2c` | `3055ecd3-6f17-4d8f-b4ae-c3e14a4b6895` | exact_match | Pass - Verified |
| StockToken-AMZN | `0xe87F2BAa2a06A52Fc20699240B623762aDa73851` | `04276025-0bfd-4ff8-b921-0afb8658ec08` | exact_match | Pass - Verified |
| StockToken-GOOGL | `0x0A8500c6eFE6d39cFc67C3B24527fac5447b0fdB` | `6f58deaf-a100-4e68-97f1-34c3b07dc37a` | exact_match | Pass - Verified |
| StockToken-META | `0xA3b2fC6F1D6D59519B4daCAC486DF75489455818` | `bbe47623-b707-45d5-a4f0-5fefd7b11ea1` | exact_match | Pass - Verified |
| StockToken-AMD | `0x1b4c7033063a0F2544ccb083A3bf015eECf73217` | `514d7b40-32c4-4020-ad81-2540ccc971ee` | exact_match | Pass - Verified |
| StockMarket | `0x9A064AE9d8277841DD01210780e9085ECC64Db18` | `7c0ab92c-6532-480f-8abd-2cbf90ea14d5` | exact_match | Pass - Verified |
| AgentVault | `0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD` | `41a5d9ea-c015-4ef9-a96a-edd9d9f5de92` | exact_match | Pass - Verified |
| StockLeagueBadge | `0xa73D1f5f6e378CFCf12473776a09B35d7dF65428` | `9c814849-4a9a-4e2c-9a76-049bf775cd52` | exact_match | Pass - Verified |

Jobs finished 13:04:08–13:04:23 UTC (20:04 WIB), ~1 s each. Raw results:
`docs/sourcify-retry-results.json`. Submission script: `contracts/sourcify-retry.js`
(note: its poll loop was fixed after this run — the v2 job endpoint returns
`isJobCompleted`, not a top-level `status` of `successful`/`failed`).

## Links (verified source on Sourcify + Blockscout)

Sourcify contract pages — `https://sourcify.dev/#/lookup/84532/{address}` — e.g.:

- TestUSDC: https://sourcify.dev/#/lookup/84532/0xc0149e09F100534631B352748bcD35B4ae0b9E67
- StockMarket: https://sourcify.dev/#/lookup/84532/0x9A064AE9d8277841DD01210780e9085ECC64Db18
- AgentVault: https://sourcify.dev/#/lookup/84532/0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD
- StockLeagueBadge: https://sourcify.dev/#/lookup/84532/0xa73D1f5f6e378CFCf12473776a09B35d7dF65428
- sAAPL: https://sourcify.dev/#/lookup/84532/0x97927B6Ab1E67Ea7857feA925a6350A4C3E10338
- sNVDA: https://sourcify.dev/#/lookup/84532/0x6679c27465c3Fd4629a44367413d40D9649dcc8E
- sMSFT: https://sourcify.dev/#/lookup/84532/0x26ee52a85AbB9D52E0Ecd372924936A3422426Ad
- sTSLA: https://sourcify.dev/#/lookup/84532/0x4524045103021CceBa762f397D5b06EAC591ea2c
- sAMZN: https://sourcify.dev/#/lookup/84532/0xe87F2BAa2a06A52Fc20699240B623762aDa73851
- sGOOGL: https://sourcify.dev/#/lookup/84532/0x0A8500c6eFE6d39cFc67C3B24527fac5447b0fdB
- sMETA: https://sourcify.dev/#/lookup/84532/0xA3b2fC6F1D6D59519B4daCAC486DF75489455818
- sAMD: https://sourcify.dev/#/lookup/84532/0x1b4c7033063a0F2544ccb083A3bf015eECf73217

Blockscout (Base Sepolia) — `https://base-sepolia.blockscout.com/address/{address}` — same 12
addresses, all "Pass - Verified".

## What remains UNVERIFIED

- **Basescan (Etherscan) — all 12, likely still unverified.** Sourcify's automatic forward to
  Etherscan failed for every job with: `Daily limit of 500 source code submissions reached`
  (Sourcify's own Etherscan daily quota, not our error). The Basescan V1 API is deprecated,
  so status could not be confirmed via API without a key. Fix options: (a) retry the
  Sourcify forward / re-submit after the daily limit resets, or (b) verify directly on
  Basescan with an API key (none available — needs Wahyu's word/key).
- Nothing else remains: Sourcify + Blockscout are done. No further Sourcify retries needed.

## Cost

$0 — testnet only, no API key used, no mainnet touched.
