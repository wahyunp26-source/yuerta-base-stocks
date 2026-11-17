// Compile all contracts with solc-js. Run: node contracts/compile.js
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const CONTRACTS_DIR = __dirname;

function findImports(importPath) {
  try {
    let full;
    if (importPath.startsWith("@openzeppelin/")) {
      full = path.join(ROOT, "node_modules", importPath);
    } else if (importPath.startsWith("./") || importPath.startsWith("../")) {
      full = path.join(CONTRACTS_DIR, importPath);
    } else {
      return { error: "unresolvable import: " + importPath };
    }
    return { contents: fs.readFileSync(full, "utf8") };
  } catch (e) {
    return { error: e.message };
  }
}

const sources = {};
for (const f of fs.readdirSync(CONTRACTS_DIR).filter((x) => x.endsWith(".sol"))) {
  sources[f] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage || e.message);
  process.exit(1);
}
for (const w of (output.errors || []).filter((e) => e.severity === "warning")) {
  console.warn("WARN:", w.formattedMessage);
}

const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
for (const [file, contracts] of Object.entries(output.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    fs.writeFileSync(
      path.join(outDir, name + ".json"),
      JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
    );
    console.log("compiled", name, "from", file);
  }
}
console.log("OK");
