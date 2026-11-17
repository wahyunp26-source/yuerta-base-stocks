// Basescan forward check: re-submit ONE contract to Sourcify v2 verify and
// report the Etherscan-forward outcome (field `etherscanForwardError`).
// The forward is Sourcify's own daily quota ("Daily limit of 500 source code
// submissions reached"), reset 00:00 UTC. If still limited, re-run this after reset.
// Usage: node contracts/basescan-forward-check.js [TestUSDC|StockMarket|...]
// $0, testnet only, no API key.
const fs = require("fs");
const path = require("path");

const CONTRACTS_DIR = __dirname;
const SERVER = "https://sourcify.dev/server";
const CHAIN_ID = "84532";
const COMPILER_VERSION = "0.8.28+commit.7893614a";

const addresses = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "addresses.json"), "utf8"));
const stdJson = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "standard.json"), "utf8"));

const targets = {
  TestUSDC: { file: "TestUSDC.sol", name: "TestUSDC", address: addresses.tUSDC },
  StockMarket: { file: "StockMarket.sol", name: "StockMarket", address: addresses.stockMarket },
  AgentVault: { file: "AgentVault.sol", name: "AgentVault", address: addresses.agentVault },
  StockLeagueBadge: { file: "StockLeagueBadge.sol", name: "StockLeagueBadge", address: addresses.badge },
};
for (const [sym, addr] of Object.entries(addresses.stockTokens || {})) {
  targets[`StockToken-${sym}`] = { file: "StockToken.sol", name: "StockToken", address: addr };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findForwardError(o, found = []) {
  if (!o || typeof o !== "object") return found;
  for (const [k, v] of Object.entries(o)) {
    if (k.toLowerCase().includes("etherscan") || k.toLowerCase().includes("forward")) found.push([k, v]);
    findForwardError(v, found);
  }
  return found;
}

(async () => {
  const label = process.argv[2] || "TestUSDC";
  const t = targets[label];
  if (!t) { console.error("Unknown contract:", label, "— pick one of:", Object.keys(targets).join(", ")); process.exit(1); }

  const res = await fetch(`${SERVER}/v2/verify/${CHAIN_ID}/${t.address}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stdJsonInput: stdJson, compilerVersion: COMPILER_VERSION, contractIdentifier: `${t.file}:${t.name}` }),
  });
  const body = await res.json().catch(() => null);
  console.log(`${label} ${t.address}: submit HTTP ${res.status} verificationId=${body?.verificationId || "-"}`);
  if (!body?.verificationId) { console.log("submit response:", JSON.stringify(body).slice(0, 1000)); process.exit(0); }

  const deadline = Date.now() + 180_000;
  let final = null;
  while (Date.now() < deadline) {
    const p = await fetch(`${SERVER}/v2/verify/${body.verificationId}`);
    const j = await p.json().catch(() => null);
    const status = j?.status || j?.job?.status || (j?.isJobCompleted ? "completed" : null);
    console.log(`poll HTTP ${p.status} status=${status}`);
    if (status === "successful" || status === "failed" || status === "completed") { final = j; break; }
    await sleep(10000);
  }
  if (!final) { console.log("job did not complete in 180s — re-check via GET /v2/verify/" + body.verificationId); process.exit(0); }

  const fwd = findForwardError(final);
  console.log("etherscan forward fields:", JSON.stringify(fwd));
  const cs = await (await fetch(`${SERVER}/v2/contract/${CHAIN_ID}/${t.address}`)).json().catch(() => null);
  console.log(`contract match=${cs?.match} creationMatch=${cs?.creationMatch} runtimeMatch=${cs?.runtimeMatch}`);
  console.log(JSON.stringify({ label, address: t.address, at: new Date().toISOString(), forward: fwd, match: cs?.match }, null, 2));
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
