import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/home");
  } catch {
    // Supabase not configured yet — show landing anyway.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-neutral-100 via-white to-neutral-100 px-6 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg">
          <span className="text-2xl font-bold">F</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Zero-fee remittance.
          <br />
          Transparent FX.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Send money home instantly. No hidden fees. Built for migrant workers
          and their families.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild size="xl" variant="brand">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          Powered by hash-chained ledger, anchored on Polygon.
        </p>
      </div>
    </main>
  );
}
