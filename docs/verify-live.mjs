// Live verification for Yuerta Stock Agent (Base Sepolia) — read-only.
// Run: node docs/verify-live.mjs
import { ethers } from 'ethers';

const RPC = 'https://sepolia.base.org';
const provider = new ethers.JsonRpcProvider(RPC);
const A = {
  tUSDC: '0xc0149e09F100534631B352748bcD35B4ae0b9E67',
  market: '0x9A064AE9d8277841DD01210780e9085ECC64Db18',
  vault: '0x484E4Cc4A1805844dABfa942BD4F1D2e267f6EeD',
  badge: '0xa73D1f5f6e378CFCf12473776a09B35d7dF65428',
  bot: '0xdd18DCC839338fA36643b1656b5829dc015A9408',
};
const TOKENS = {
  AAPL: '0x97927B6Ab1E67Ea7857feA925a6350A4C3E10338',
  NVDA: '0x6679c27465c3Fd4629a44367413d40D9649dcc8E',
  MSFT: '0x26ee52a85AbB9D52E0Ecd372924936A3422426Ad',
  TSLA: '0x4524045103021CceBa762f397D5b06EAC591ea2c',
  AMZN: '0xe87F2BAa2a06A52Fc20699240B623762aDa73851',
  GOOGL: '0x0A8500c6eFE6d39cFc67C3B24527fac5447b0fdB',
  META: '0xA3b2fC6F1D6D59519B4daCAC486DF75489455818',
  AMD: '0x1b4c7033063a0F2544ccb083A3bf015eECf73217',
};
const marketAbi = [
  'function price(uint8 id) view returns (uint256 priceUsd8)',
  'function priceUpdatedAt(uint8 id) view returns (uint256)',
  'function totalVolumeUsd() view returns (uint256)',
  'function tradeCount() view returns (uint256)',
  'function stockToken(uint8 id) view returns (address)',
  'function FEE_BPS() view returns (uint256)',
];
const erc20Abi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];
const vaultAbi = [
  'function totalAssets() view returns (uint256)',
  'function navPerShare() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

const out = { checkedAt: new Date().toISOString(), block: await provider.getBlockNumber() };
const market = new ethers.Contract(A.market, marketAbi, provider);
const tusdc = new ethers.Contract(A.tUSDC, erc20Abi, provider);
const vault = new ethers.Contract(A.vault, vaultAbi, provider);

out.feeBps = Number(await market.FEE_BPS());
out.totalVolumeUsd = Number(await market.totalVolumeUsd()) / 1e6;
out.tradeCount = Number(await market.tradeCount());
const names = Object.keys(TOKENS);
out.prices = {};
for (let i = 0; i < names.length; i++) {
  const p = await market.price(i);
  const ts = await market.priceUpdatedAt(i);
  out.prices[names[i]] = { usd: Number(p) / 1e8, updatedAt: new Date(Number(ts) * 1000).toISOString(), ageHrs: ((Date.now() / 1000 - Number(ts)) / 3600).toFixed(1) };
}
out.botTusdc = Number(await tusdc.balanceOf(A.bot)) / 1e6;
out.botEth = Number(ethers.formatEther(await provider.getBalance(A.bot)));
out.marketTusdc = Number(await tusdc.balanceOf(A.market)) / 1e6;
out.vault = {
  totalAssetsUsd: Number(await vault.totalAssets()) / 1e6,
  navPerShare: Number(await vault.navPerShare()) / 1e6,
  shares: Number(await vault.totalSupply()) / 1e6,
};
out.botStocks = {};
for (const [name, addr] of Object.entries(TOKENS)) {
  const c = new ethers.Contract(addr, erc20Abi, provider);
  out.botStocks[name] = Number(await c.balanceOf(A.bot)) / 1e8;
}
out.tusdcTotalSupply = Number(await tusdc.totalSupply()) / 1e6;
// unique traders: count distinct Trade event senders via eth_getLogs (deployment block unknown; scan last ~2M blocks is too broad — use market tradeCount as proxy and note it)
console.log(JSON.stringify(out, null, 2));
