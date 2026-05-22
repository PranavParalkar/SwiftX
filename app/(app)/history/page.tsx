import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

// TODO(P1): load real transactions via supabase server client
const DEMO_TXS = [
  {
    id: 42,
    direction: "out" as const,
    amount: "$180.65",
    party: "Mother (Kerala)",
    when: "Just now",
    inr: "₹15,000",
  },
  {
    id: 41,
    direction: "out" as const,
    amount: "$120.00",
    party: "Mother (Kerala)",
    when: "Last week",
    inr: "₹9,984",
  },
  {
    id: 40,
    direction: "in" as const,
    amount: "$500.00",
    party: "Salary top-up",
    when: "Apr 1",
    inr: "",
  },
];

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">All transactions, signed and verifiable.</p>
      </header>

      <ul className="divide-y rounded-xl border bg-card">
        {DEMO_TXS.map((tx) => {
          const isOut = tx.direction === "out";
          const Icon = isOut ? ArrowUpRight : ArrowDownLeft;
          return (
            <li key={tx.id}>
              <Link
                href={`/history/${tx.id}`}
                className="flex items-center gap-3 p-4 hover:bg-accent"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isOut
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                      : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.party}</p>
                  <p className="text-xs text-muted-foreground">{tx.when}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {isOut ? "−" : "+"}
                    {tx.amount}
                  </p>
                  {tx.inr ? (
                    <p className="text-xs text-muted-foreground">{tx.inr}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
