// Local bytecode check: compiled deployedBytecode vs on-chain runtime code (Base Sepolia).
// Run: node contracts/local-verify.js
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");

const CONTRACTS_DIR = __dirname;
const addresses = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "addresses.json"), "utf8"));
const stdJson = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, "standard.json"), "utf8"));

const input = JSON.parse(JSON.stringify(stdJson));
input.settings.outputSelection = { "*": { "*": ["evm.deployedBytecode.object", "evm.bytecode.object"] } };

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: (p) => {
  if (stdJson.sources[p]) return { contents: stdJson.sources[p].content };
  return { error: "unresolvable import: " + p };
}}));
const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length) { for (const e of errors) console.error(e.formattedMessage); process.exit(1); }

const targets = [
  ["TestUSDC", "TestUSDC.sol", addresses.tUSDC],
  ...Object.entries(addresses.stockTokens).map(([sym, addr]) => [`StockToken-${sym}`, "StockToken.sol", addr]),
  ["StockMarket", "StockMarket.sol", addresses.stockMarket],
  ["AgentVault", "AgentVault.sol", addresses.agentVault],
  ["StockLeagueBadge", "StockLeagueBadge.sol", addresses.badge],
];

function diffRanges(a, b) {
  // a, b: hex strings without 0x, same length. Return list of [startByte, endByte) differing ranges.
  const ranges = [];
  let start = -1;
  for (let i = 0; i < a.length; i += 2) {
    const d = a.slice(i, i + 2) !== b.slice(i, i + 2);
    if (d && start === -1) start = i / 2;
    if (!d && start !== -1) { ranges.push([start, i / 2]); start = -1; }
  }
  if (start !== -1) ranges.push([start, a.length / 2]);
  return ranges;
}

(async () => {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  for (const [label, file, addr] of targets) {
    const name = label.startsWith("StockToken-") ? "StockToken" : label;
    const compiled = output.contracts[file][name].evm.deployedBytecode.object;
    const onchain = (await provider.getCode(addr)).slice(2);
    let verdict;
    if (compiled === onchain) {
      verdict = "EXACT MATCH";
      console.log(`${label} ${addr} len=${compiled.length / 2}B : ${verdict}`);
    } else if (compiled.length === onchain.length) {
      const ranges = diffRanges(compiled, onchain);
      const nBytes = ranges.reduce((s, [a, b]) => s + (b - a), 0);
      verdict = `SAME LENGTH, ${nBytes} differing bytes in ${ranges.length} range(s): ` +
        ranges.map(([a, b]) => `${a}-${b}`).join(", ");
      console.log(`${label} ${addr} len=${compiled.length / 2}B : ${verdict}`);
    } else {
      verdict = `LENGTH MISMATCH compiled=${compiled.length / 2}B onchain=${onchain.length / 2}B`;
      console.log(`${label} ${addr} : ${verdict}`);
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
