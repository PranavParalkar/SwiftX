import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TODO(P3): wire to /api/verify-chain and PolygonScan URL
type Params = Promise<{ id: string }>;

export default async function TransactionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="pt-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Transaction #{id}
        </p>
        <h1 className="mt-1 text-2xl font-bold">$180.65 → ₹15,000</h1>
        <p className="text-sm text-muted-foreground">
          To Mother (Kerala) · Just now
        </p>
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Hash chain receipt</h2>
        <dl className="mt-3 space-y-2 text-xs">
          <Field label="Tx hash" value="4f2c8a1e…b9d3" mono />
          <Field label="Prev hash" value="9a3b71fd…42c8" mono />
          <Field label="Anchor #" value="12 (Polygon Amoy)" />
        </dl>
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link
            href="https://amoy.polygonscan.com"
            target="_blank"
            rel="noreferrer"
          >
            View on PolygonScan
          </Link>
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">FX breakdown</h2>
        <dl className="mt-3 space-y-2 text-xs">
          <Field label="Mid-market rate" value="1 USD = 83.37 INR" />
          <Field label="Your rate" value="1 USD = 83.20 INR" />
          <Field label="Spread" value="0.20%" />
          <Field label="Fee" value="$0.00" />
        </dl>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
