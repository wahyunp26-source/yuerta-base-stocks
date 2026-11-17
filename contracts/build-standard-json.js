// Rebuild the Sourcify standard JSON for Base Stocks (solc 0.8.28, optimizer runs 200).
// Resolves ALL sources transitively: local .sol files + @openzeppelin imports from node_modules.
// Output: contracts/standard.json (persistent — NOT /tmp).
// Run: node contracts/build-standard-json.js
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const CONTRACTS_DIR = __dirname;

const sources = {}; // key = import path as solc sees it, value = { content }

function keyFor(fullPath) {
  const nm = path.join(ROOT, "node_modules") + path.sep;
  if (fullPath.startsWith(nm)) return path.relative(path.join(ROOT, "node_modules"), fullPath).split(path.sep).join("/");
  const cd = CONTRACTS_DIR + path.sep;
  if (fullPath.startsWith(cd)) return path.relative(CONTRACTS_DIR, fullPath).split(path.sep).join("/");
  throw new Error("source outside known roots: " + fullPath);
}

function addSource(fullPath) {
  const key = keyFor(fullPath);
  if (sources[key]) return;
  const content = fs.readFileSync(fullPath, "utf8");
  sources[key] = { content };
  // Recursively resolve imports in this file
  const importRe = /import\s+(?:[^'"]*from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    const imp = m[1];
    if (imp.startsWith("@openzeppelin/")) {
      addSource(path.join(ROOT, "node_modules", imp));
    } else if (imp.startsWith("./") || imp.startsWith("../")) {
      const importerDir = path.dirname(fullPath);
      addSource(path.normalize(path.join(importerDir, imp)));
    } else {
      throw new Error("unresolvable import " + imp + " in " + key);
    }
  }
}

for (const f of fs.readdirSync(CONTRACTS_DIR).filter((x) => x.endsWith(".sol"))) {
  addSource(path.join(CONTRACTS_DIR, f));
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

// Sanity: compile it locally with the same solc-js and confirm no errors.
const output = JSON.parse(
  solc.compile(
    JSON.stringify(input),
    {
      import: (p) => {
        if (sources[p]) return { contents: sources[p].content };
        return { error: "unresolvable import: " + p };
      },
    }
  )
);
const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage || e.message);
  process.exit(1);
}

const outPath = path.join(CONTRACTS_DIR, "standard.json");
fs.writeFileSync(outPath, JSON.stringify(input, null, 2));
console.log("solc version:", solc.version());
console.log("sources:", Object.keys(sources).length);
for (const k of Object.keys(sources).sort()) console.log("  -", k);
console.log("compiled OK, wrote", outPath);
