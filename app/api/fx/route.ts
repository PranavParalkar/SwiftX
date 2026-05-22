import { NextRequest, NextResponse } from "next/server";
import { getFxRate } from "@/lib/fx";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = req.nextUrl.searchParams.get("to")?.toUpperCase();
  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' or 'to' query param" },
      { status: 400 }
    );
  }

  try {
    const quote = await getFxRate(from, to);
    return NextResponse.json(quote);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "FX fetch failed" },
      { status: 500 }
    );
  }
}
