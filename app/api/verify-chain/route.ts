import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyChain, type ChainTx } from "@/lib/chain";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("transactions")
    .select(
      "id, from_wallet_id, to_wallet_id, from_amount, to_amount, fx_rate, created_at, prev_hash, current_hash"
    )
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const txs: ChainTx[] = (data ?? []).map((t) => ({
    id: t.id,
    from_wallet_id: t.from_wallet_id,
    to_wallet_id: t.to_wallet_id,
    from_amount: Number(t.from_amount),
    to_amount: Number(t.to_amount),
    fx_rate: Number(t.fx_rate),
    created_at: t.created_at,
    prev_hash: t.prev_hash,
    current_hash: t.current_hash,
  }));

  const result = verifyChain(txs);
  return NextResponse.json({
    ...result,
    total: txs.length,
  });
}
