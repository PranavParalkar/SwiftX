/**
 * Seed Ravi (Dubai USD) + Mother (Kerala INR) and 30+ realistic transactions.
 *
 * Usage:
 *   1. Fill in NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. npx tsx scripts/seed.ts
 *
 * This script uses the admin (service role) client and bypasses RLS.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { computeTxHash } from "../lib/chain";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("⚠️  Seeding is a one-time setup. Re-run will fail on unique constraints.");
  console.log("TODO(P4): implement the actual seed logic — see plan section 22.");
  console.log("Targets:");
  console.log("  - Ravi (Dubai, AE, USD wallet $500)");
  console.log("  - Amma (Kerala, IN, INR wallet ₹0)");
  console.log("  - 30+ transactions over the last 90 days");
  console.log("  - At least one mid-chain transaction with a known hash for the receipt screen");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Force `computeTxHash` / `supabase` to be reachable when the seed body lands.
void computeTxHash;
void supabase;
