import { Card } from "@/components/ui/card";

// TODO(P1): sum balances by currency from wallets table
export default function PoolsPage() {
  const pools = [
    { currency: "USD", balance: 142_380, inflow: 18_402, outflow: 16_120 },
    { currency: "INR", balance: 11_840_000, inflow: 1_344_000, outflow: 1_512_000 },
    { currency: "AED", balance: 52_180, inflow: 6_240, outflow: 5_810 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Liquidity pools</h1>
        <p className="text-sm text-muted-foreground">
          Multi-currency balances. Rebalanced off-platform daily.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pools.map((p) => (
          <Card key={p.currency} className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {p.currency} pool
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {p.balance.toLocaleString()}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Inflow 24h</dt>
                <dd className="text-success tabular-nums">
                  +{p.inflow.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Outflow 24h</dt>
                <dd className="text-destructive tabular-nums">
                  −{p.outflow.toLocaleString()}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
