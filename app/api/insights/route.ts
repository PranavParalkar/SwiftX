import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateInsight, type TxSummary } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    language?: "en" | "hi";
  };
  const language = body.language === "hi" ? "hi" : "en";

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, country_code")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: txs } = await admin
    .from("transactions")
    .select("from_amount, from_currency, to_amount, to_currency, created_at")
    .or(
      `from_wallet_id.in.(select id from wallets where user_id.eq.${user.id})`
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const recentTransactions: TxSummary[] = (txs ?? []).map((t) => ({
    date: t.created_at,
    amount: Number(t.from_amount),
    fromCurrency: t.from_currency,
    receivedAmount: Number(t.to_amount),
    toCurrency: t.to_currency,
  }));

  try {
    const text = await generateInsight({
      userName: profile.full_name,
      countryCode: profile.country_code,
      language,
      recentTransactions,
    });
    return NextResponse.json({ insight: text, language });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
