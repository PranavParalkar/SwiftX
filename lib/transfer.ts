import { createAdminClient } from "@/lib/supabase/server";
import { getFxRate } from "@/lib/fx";
import { computeTxHash } from "@/lib/chain";
import { runAmlChecks, shouldBlock } from "@/lib/aml";

export type TransferInput = {
  fromUserId: string;
  toUserPhone: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
};

export type TransferResult = {
  transactionId: number;
  fromAmount: number;
  toAmount: number;
  fxRate: number;
  hash: string;
  flags: { rule: string; severity: string; reason: string }[];
};

export async function executeTransfer(input: TransferInput): Promise<TransferResult> {
  const admin = createAdminClient();

  // 1. FX rate
  const quote = await getFxRate(input.fromCurrency, input.toCurrency);
  const toAmount = +(input.amount * quote.rate).toFixed(4);

  // 2. Resolve wallets
  const { data: fromWallet, error: fwErr } = await admin
    .from("wallets")
    .select("id, balance, user_id")
    .eq("user_id", input.fromUserId)
    .eq("currency", input.fromCurrency)
    .maybeSingle();
  if (fwErr) throw fwErr;
  if (!fromWallet) throw new Error("Sender wallet not found");

  if (Number(fromWallet.balance) < input.amount) {
    throw new Error("Insufficient balance");
  }

  const { data: toProfile, error: tpErr } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", input.toUserPhone)
    .maybeSingle();
  if (tpErr) throw tpErr;
  if (!toProfile) throw new Error("Recipient not found");

  // 3. AML
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await admin
    .from("transactions")
    .select("from_amount")
    .eq("from_wallet_id", fromWallet.id)
    .gte("created_at", since);
  const recentSum = (recent ?? []).reduce(
    (s, r) => s + Number(r.from_amount),
    0
  );

  const flags = runAmlChecks({
    fromWalletId: fromWallet.id,
    fromUserId: input.fromUserId,
    amount: input.amount,
    currency: input.fromCurrency,
    recentTxCount24h: recent?.length ?? 0,
    recentTxSum24h: recentSum,
  });
  if (shouldBlock(flags)) {
    throw new Error(
      "Transfer blocked by AML policy: " + flags.map((f) => f.reason).join("; ")
    );
  }

  // 4. Execute atomic transfer (DB function — see supabase migration)
  const { data: txRow, error: rpcErr } = await admin
    .rpc("execute_transfer", {
      p_from_user_id: input.fromUserId,
      p_to_user_id: toProfile.id,
      p_from_currency: input.fromCurrency,
      p_to_currency: input.toCurrency,
      p_from_amount: input.amount,
      p_to_amount: toAmount,
      p_fx_rate: quote.rate,
    })
    .single<{
      id: number;
      from_wallet_id: string;
      to_wallet_id: string;
      from_amount: number;
      to_amount: number;
      fx_rate: number;
      created_at: string;
      prev_hash: string | null;
    }>();
  if (rpcErr) throw rpcErr;
  if (!txRow) throw new Error("Transfer RPC returned no row");

  // 5. Hash the transaction and write it back
  const hash = computeTxHash({
    id: txRow.id,
    from_wallet_id: txRow.from_wallet_id,
    to_wallet_id: txRow.to_wallet_id,
    from_amount: Number(txRow.from_amount),
    to_amount: Number(txRow.to_amount),
    fx_rate: Number(txRow.fx_rate),
    created_at: txRow.created_at,
    prev_hash: txRow.prev_hash,
  });

  await admin
    .from("transactions")
    .update({ current_hash: hash })
    .eq("id", txRow.id);

  // 6. Persist AML flags (if any non-blocking remain)
  if (flags.length > 0) {
    await admin.from("aml_flags").insert(
      flags.map((f) => ({
        transaction_id: txRow.id,
        rule_triggered: f.rule,
        severity: f.severity,
        notes: f.reason,
      }))
    );
  }

  return {
    transactionId: txRow.id,
    fromAmount: Number(txRow.from_amount),
    toAmount: Number(txRow.to_amount),
    fxRate: Number(txRow.fx_rate),
    hash,
    flags,
  };
}

