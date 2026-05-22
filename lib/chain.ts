import { createHash } from "crypto";

export type ChainTx = {
  id: number | string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  from_amount: number;
  to_amount: number;
  fx_rate: number;
  created_at: string;
  prev_hash: string | null;
  current_hash?: string;
};

export const GENESIS = "GENESIS";

export function computeTxHash(tx: Omit<ChainTx, "current_hash">): string {
  const payload = [
    tx.id,
    tx.from_wallet_id ?? "",
    tx.to_wallet_id ?? "",
    tx.from_amount.toFixed(8),
    tx.to_amount.toFixed(8),
    tx.fx_rate.toFixed(8),
    tx.created_at,
    tx.prev_hash ?? GENESIS,
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export type ChainVerifyResult =
  | { valid: true; brokenAt: null }
  | { valid: false; brokenAt: ChainTx["id"]; reason: "hash_mismatch" | "prev_hash_mismatch" };

export function verifyChain(transactions: ChainTx[]): ChainVerifyResult {
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const expected = computeTxHash(tx);
    if (expected !== tx.current_hash) {
      return { valid: false, brokenAt: tx.id, reason: "hash_mismatch" };
    }
    if (i > 0 && tx.prev_hash !== transactions[i - 1].current_hash) {
      return { valid: false, brokenAt: tx.id, reason: "prev_hash_mismatch" };
    }
  }
  return { valid: true, brokenAt: null };
}

export function rootHash(transactions: ChainTx[]): string | null {
  if (transactions.length === 0) return null;
  return transactions[transactions.length - 1].current_hash ?? null;
}
