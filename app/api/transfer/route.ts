import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeTransfer } from "@/lib/transfer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    toUserPhone?: string;
    fromCurrency?: string;
    toCurrency?: string;
    amount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { toUserPhone, fromCurrency, toCurrency, amount } = body;
  if (!toUserPhone || !fromCurrency || !toCurrency || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  try {
    const result = await executeTransfer({
      fromUserId: user.id,
      toUserPhone,
      fromCurrency,
      toCurrency,
      amount,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
