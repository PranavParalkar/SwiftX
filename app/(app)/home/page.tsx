import Link from "next/link";
import { Send, ArrowDownLeft, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TODO(P1): load real wallets via supabase server client
const DEMO_WALLETS = [
  { currency: "USD", balance: 542.18, flag: "🇺🇸" },
  { currency: "INR", balance: 18_240, flag: "🇮🇳" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold">Ravi</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-base font-semibold">
          R
        </div>
      </header>

      <Card className="bg-brand text-brand-foreground">
        <div className="p-5">
          <p className="text-xs uppercase tracking-wider opacity-80">
            Primary balance
          </p>
          <p className="mt-1 text-4xl font-bold">
            ${DEMO_WALLETS[0].balance.toFixed(2)}
          </p>
          <p className="mt-1 text-sm opacity-80">USD · United States</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <ActionButton href="/send" icon={Send} label="Send" />
        <ActionButton href="/kyc" icon={ArrowDownLeft} label="Top up" />
        <ActionButton href="/history" icon={History} label="History" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Your wallets
        </h2>
        <div className="space-y-2">
          {DEMO_WALLETS.map((w) => (
            <Card key={w.currency} className="flex items-center gap-3 p-4">
              <span className="text-2xl">{w.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{w.currency}</p>
                <p className="text-xs text-muted-foreground">
                  {w.currency === "USD" ? "US Dollar" : "Indian Rupee"}
                </p>
              </div>
              <p className="font-semibold tabular-nums">
                {w.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Send;
  label: string;
}) {
  return (
    <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3">
      <Link href={href}>
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}
