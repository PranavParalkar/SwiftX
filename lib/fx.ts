import { createAdminClient } from "@/lib/supabase/server";

const FX_TTL_MS = 60 * 60 * 1000; // 1 hour
const SPREAD = 0.002; // 0.2% — our transparent FX margin

export type FxQuote = {
  rate: number;
  midMarketRate: number;
  spread: number;
  fetchedAt: Date;
  source: "cache" | "live" | "fallback";
};

const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.2, AED: 3.67 },
  AED: { INR: 22.65, USD: 0.272 },
  INR: { USD: 0.012, AED: 0.044 },
};

export async function getFxRate(
  from: string,
  to: string
): Promise<FxQuote> {
  if (from === to) {
    return { rate: 1, midMarketRate: 1, spread: 0, fetchedAt: new Date(), source: "live" };
  }

  const supabase = createAdminClient();

  const sinceIso = new Date(Date.now() - FX_TTL_MS).toISOString();
  const cached = await supabase
    .from("fx_rates_cache")
    .select("rate, fetched_at")
    .eq("base_currency", from)
    .eq("target_currency", to)
    .gte("fetched_at", sinceIso)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached.data) {
    const userRate = cached.data.rate;
    return {
      rate: userRate,
      midMarketRate: userRate / (1 - SPREAD),
      spread: SPREAD,
      fetchedAt: new Date(cached.data.fetched_at),
      source: "cache",
    };
  }

  try {
    const res = await fetch(
      `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const midMarket: number | undefined = data?.rates?.[to];
    if (!midMarket) throw new Error("rate not in response");

    const userRate = midMarket * (1 - SPREAD);

    await supabase.from("fx_rates_cache").insert({
      base_currency: from,
      target_currency: to,
      rate: userRate,
    });

    return {
      rate: userRate,
      midMarketRate: midMarket,
      spread: SPREAD,
      fetchedAt: new Date(),
      source: "live",
    };
  } catch (err) {
    console.warn("FX live fetch failed, using fallback", err);
    const mid = FALLBACK_RATES[from]?.[to];
    if (!mid) throw new Error(`No FX rate available for ${from}->${to}`);
    return {
      rate: mid * (1 - SPREAD),
      midMarketRate: mid,
      spread: SPREAD,
      fetchedAt: new Date(),
      source: "fallback",
    };
  }
}
