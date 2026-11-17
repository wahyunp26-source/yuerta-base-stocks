// Sourcify retry: submit standard-JSON verification for all 12 Base Stocks contracts.
// POST https://sourcify.dev/server/v2/verify/{chainId}/{address}
// Body: { stdJsonInput, compilerVersion, contractIdentifier }
// Then polls GET /v2/verify/{verificationId} until terminal (max ~240s total).
// Writes results to docs/sourcify-retry-results.json. Run: node contracts/sourcify-retry.js
const fs = require("fs");
const path = require("path");

const CONTRACTS_DIR = __dirname;
const DOCS_DIR = path.join(CONTRACTS_DIR, "..", "docs");
const SERVER = "https://sourcify.dev/server";
const CHAIN_ID = "84532";
const COMPILER_VERSION = "0.8.28+commit.7893614a";

const addresses = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "addresses.json"), "utf8"));
const stdJson = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "standard.json"), "utf8"));

const targets = [
  { label: "TestUSDC", file: "TestUSDC.sol", name: "TestUSDC", address: addresses.tUSDC },
  ...Object.entries(addresses.stockTokens).map(([sym, addr]) => ({
    label: `StockToken-${sym}`, file: "StockToken.sol", name: "StockToken", address: addr,
  })),
  { label: "StockMarket", file: "StockMarket.sol", name: "StockMarket", address: addresses.stockMarket },
  { label: "AgentVault", file: "AgentVault.sol", name: "AgentVault", address: addresses.agentVault },
  { label: "StockLeagueBadge", file: "StockLeagueBadge.sol", name: "StockLeagueBadge", address: addresses.badge },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(t) {
  const url = `${SERVER}/v2/verify/${CHAIN_ID}/${t.address}`;
  const body = {
    stdJsonInput: stdJson,
    compilerVersion: COMPILER_VERSION,
    contractIdentifier: `${t.file}:${t.name}`,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { httpStatus: res.status, json, raw: text.slice(0, 2000) };
}

async function pollJob(verificationId) {
  const res = await fetch(`${SERVER}/v2/verify/${verificationId}`);
  const text = await res.text();
  try { return { httpStatus: res.status, json: JSON.parse(text) }; }
  catch { return { httpStatus: res.status, raw: text.slice(0, 2000) }; }
}

(async () => {
  const results = [];
  // Phase 1: submit all 12 (max 2 attempts each on transport/5xx errors only)
  for (const t of targets) {
    let attempt = 0;
    let out = null;
    while (attempt < 2) {
      attempt++;
      try {
        out = await submit(t);
        // 202 = accepted. Anything else is a submission-level outcome; do not blindly retry
        // a deterministic 4xx (e.g. already verified / bad input). Retry only 5xx/429.
        if (out.httpStatus < 500 && out.httpStatus !== 429) break;
        console.log(`${t.label}: submit attempt ${attempt} -> HTTP ${out.httpStatus}, retrying once...`);
        await sleep(5000);
      } catch (e) {
        console.log(`${t.label}: submit attempt ${attempt} threw: ${e.message}`);
        out = { error: String(e) };
        if (attempt < 2) await sleep(5000);
      }
    }
    const verificationId = out?.json?.verificationId || null;
    console.log(`${t.label} ${t.address}: submit HTTP ${out?.httpStatus} verificationId=${verificationId} ${JSON.stringify(out?.json || out?.raw || out?.error || "").slice(0, 300)}`);
    results.push({ ...t, submit: out, verificationId, attempts: attempt, final: null });
    await sleep(1000);
  }

  // Phase 2: poll jobs until terminal or 300s total
  const deadline = Date.now() + 300_000;
  const pending = () => results.filter((r) => r.verificationId && !r.final);
  while (pending().length && Date.now() < deadline) {
    for (const r of pending()) {
      try {
        const p = await pollJob(r.verificationId);
        // v2 job shape: { isJobCompleted: true, ... } — there is NO top-level `status`
        // field of "successful"/"failed" on this endpoint. Treat isJobCompleted as terminal.
        const status = p.json?.status || p.json?.job?.status || (p.json?.isJobCompleted ? "completed" : null);
        console.log(`${r.label}: poll HTTP ${p.httpStatus} status=${status} ${JSON.stringify(p.json).slice(0, 500)}`);
        if (status === "successful" || status === "failed" || status === "completed") {
          r.final = p.json;
        } else if (p.httpStatus === 404) {
          r.final = { status: "unknown-job-404", raw: p.raw || p.json };
        }
      } catch (e) {
        console.log(`${r.label}: poll threw: ${e.message}`);
      }
    }
    if (pending().length) await sleep(10000);
  }
  for (const r of pending()) r.final = { status: "still-pending-after-300s", note: "re-check later via GET /v2/verify/" + r.verificationId };

  // Phase 3: confirm on-chain match status via contract endpoint (authoritative)
  for (const r of results) {
    try {
      const res = await fetch(`${SERVER}/v2/contract/${CHAIN_ID}/${r.address}`);
      r.contractStatus = await res.json();
    } catch (e) {
      r.contractStatus = { error: String(e) };
    }
    console.log(`${r.label}: contract match=${r.contractStatus?.match} creationMatch=${r.contractStatus?.creationMatch} runtimeMatch=${r.contractStatus?.runtimeMatch}`);
  }

  fs.writeFileSync(path.join(DOCS_DIR, "sourcify-retry-results.json"), JSON.stringify({ runAt: new Date().toISOString(), compilerVersion: COMPILER_VERSION, results }, null, 2));
  console.log("WROTE docs/sourcify-retry-results.json");
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
