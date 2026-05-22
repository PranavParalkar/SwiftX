import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { anchorHashOnChain, polygonScanUrl } from "@/lib/polygon";
import { computeTxHash, type ChainTx } from "@/lib/chain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 5;

// Cron-callable: anchor the latest chain hash to Polygon Amoy.
// Auth via shared secret header (Vercel Cron / scheduler).
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-anchor-secret");
  if (secret !== process.env.ANCHOR_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: lastAnchor } = await admin
    .from("polygon_anchors")
    .select("to_tx_id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sinceId = lastAnchor?.to_tx_id ?? 0;

  const { data: pending } = await admin
    .from("transactions")
    .select(
      "id, from_wallet_id, to_wallet_id, from_amount, to_amount, fx_rate, created_at, prev_hash, current_hash"
    )
    .gt("id", sinceId)
    .order("id", { ascending: true })
    .limit(BATCH_SIZE);

  if (!pending || pending.length < BATCH_SIZE) {
    return NextResponse.json({
      anchored: false,
      reason: `not enough new transactions (have ${pending?.length ?? 0}, need ${BATCH_SIZE})`,
    });
  }

  // Verify and use the latest hash as the anchor.
  const chainTxs: ChainTx[] = pending.map((p) => ({
    id: p.id,
    from_wallet_id: p.from_wallet_id,
    to_wallet_id: p.to_wallet_id,
    from_amount: Number(p.from_amount),
    to_amount: Number(p.to_amount),
    fx_rate: Number(p.fx_rate),
    created_at: p.created_at,
    prev_hash: p.prev_hash,
    current_hash: p.current_hash,
  }));

  for (const tx of chainTxs) {
    const expected = computeTxHash(tx);
    if (expected !== tx.current_hash) {
      return NextResponse.json(
        { error: `Chain corrupted at tx #${tx.id}` },
        { status: 500 }
      );
    }
  }

  const anchor = chainTxs[chainTxs.length - 1].current_hash!;
  const { txHash, anchorId } = await anchorHashOnChain(anchor);

  await admin.from("polygon_anchors").insert({
    chain_hash: anchor,
    polygon_tx_hash: txHash,
    from_tx_id: chainTxs[0].id,
    to_tx_id: chainTxs[chainTxs.length - 1].id,
  });

  await admin
    .from("transactions")
    .update({ polygon_anchor_tx: txHash })
    .in(
      "id",
      chainTxs.map((c) => c.id)
    );

  return NextResponse.json({
    anchored: true,
    anchorId: anchorId.toString(),
    txHash,
    url: polygonScanUrl(txHash),
    batchSize: chainTxs.length,
  });
}
