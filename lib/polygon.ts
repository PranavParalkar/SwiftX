import { ethers } from "ethers";

const RPC_URL = process.env.POLYGON_AMOY_RPC ?? "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.LEDGER_ANCHOR_CONTRACT;

const ABI = [
  "function anchor(bytes32 chainHash) external",
  "function verify(uint256 id, bytes32 expectedHash) external view returns (bool)",
  "function latestAnchorId() external view returns (uint256)",
  "function anchors(uint256) external view returns (bytes32)",
  "event Anchored(uint256 indexed id, bytes32 hash, uint256 timestamp)",
];

function getContract(signer: boolean) {
  if (!CONTRACT_ADDRESS) throw new Error("LEDGER_ANCHOR_CONTRACT not configured");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  if (signer) {
    if (!PRIVATE_KEY) throw new Error("POLYGON_PRIVATE_KEY not configured");
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function anchorHashOnChain(chainHash: string): Promise<{
  txHash: string;
  anchorId: bigint;
}> {
  const contract = getContract(true);
  const hashBytes32 = chainHash.startsWith("0x") ? chainHash : `0x${chainHash}`;
  const tx = await contract.anchor(hashBytes32);
  const receipt = await tx.wait();
  const anchorId = await contract.latestAnchorId();
  return { txHash: receipt.hash, anchorId };
}

export async function verifyAnchor(
  anchorId: bigint,
  expectedHash: string
): Promise<boolean> {
  const contract = getContract(false);
  const hashBytes32 = expectedHash.startsWith("0x") ? expectedHash : `0x${expectedHash}`;
  return contract.verify(anchorId, hashBytes32);
}

export function polygonScanUrl(txHash: string): string {
  return `https://amoy.polygonscan.com/tx/${txHash}`;
}
