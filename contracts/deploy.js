// Deploy all contracts to Base Sepolia. Run: node contracts/deploy.js
// Requires: bot-key.json (testnet-only key) funded with Sepolia ETH from a faucet.
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC = "https://sepolia.base.org";
const TICKERS = ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "GOOGL", "META", "AMD"];
const NAMES = {
  AAPL: "Yuerta Test Apple",
  NVDA: "Yuerta Test NVIDIA",
  MSFT: "Yuerta Test Microsoft",
  TSLA: "Yuerta Test Tesla",
  AMZN: "Yuerta Test Amazon",
  GOOGL: "Yuerta Test Alphabet",
  META: "Yuerta Test Meta",
  AMD: "Yuerta Test AMD",
};

async function main() {
  const key = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "bot-key.json"), "utf8"));
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(key.privateKey, provider);
  const net = await provider.getNetwork();
  if (net.chainId !== 84532n) throw new Error("wrong chain: " + net.chainId);
  const bal = await provider.getBalance(wallet.address);
  console.log("deployer:", wallet.address, "balance:", ethers.formatEther(bal), "ETH");
  if (bal < ethers.parseEther("0.01")) throw new Error("deployer needs Sepolia ETH — claim from a Base Sepolia faucet first");

  const load = (n) => {
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, "out", n + ".json"), "utf8"));
    return new ethers.ContractFactory(j.abi, j.bytecode, wallet);
  };

  const tusdc = await (await load("TestUSDC").deploy()).waitForDeployment();
  console.log("TestUSDC:", await tusdc.getAddress());

  const stockAddrs = [];
  const stockTokens = {};
  for (const t of TICKERS) {
    const c = await (await load("StockToken").deploy(NAMES[t], "s" + t)).waitForDeployment();
    const a = await c.getAddress();
    stockAddrs.push(a);
    stockTokens[t] = a;
    console.log("StockToken s" + t + ":", a);
  }

  const market = await (await load("StockMarket").deploy(
    await tusdc.getAddress(), stockAddrs, TICKERS
  )).waitForDeployment();
  const marketAddr = await market.getAddress();
  console.log("StockMarket:", marketAddr);

  for (const t of TICKERS) {
    const c = load("StockToken").attach(stockTokens[t]);
    await (await c.setMarket(marketAddr)).wait();
  }
  console.log("market set on all stock tokens");

  const vault = await (await load("AgentVault").deploy(
    await tusdc.getAddress(), marketAddr
  )).waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("AgentVault:", vaultAddr);

  const badge = await (await load("StockLeagueBadge").deploy()).waitForDeployment();
  console.log("StockLeagueBadge:", await badge.getAddress());

  // Seed the market with 10,000 tUSDC so sells can be paid out.
  await (await tusdc.claim()).wait();
  await (await tusdc.transfer(marketAddr, 10_000n * 10n ** 6n)).wait();
  console.log("market seeded with 10,000 tUSDC");

  const addresses = {
    chainId: 84532,
    network: "Base Sepolia",
    deployer: wallet.address,
    tUSDC: await tusdc.getAddress(),
    stockMarket: marketAddr,
    agentVault: vaultAddr,
    badge: await badge.getAddress(),
    stockTokens,
  };
  fs.writeFileSync(path.join(__dirname, "..", "bot", "addresses.json"), JSON.stringify(addresses, null, 2));
  fs.writeFileSync(path.join(__dirname, "addresses.json"), JSON.stringify(addresses, null, 2));
  console.log("addresses written to bot/addresses.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
