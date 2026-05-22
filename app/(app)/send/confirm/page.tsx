import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TODO(P2): replace with real <FXBreakdown /> component fed by /api/fx.
// Placeholder reflects the hero screen from plan section 9 step 6.
export default function SendConfirmPage() {
  const fromAmount = 180.65;
  const toAmount = 15_000;
  const rate = 83.2;
  const fee = 0;
  const savedVsBank = 2.3;

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <header>
        <p className="text-sm text-muted-foreground">Review and confirm</p>
        <h1 className="text-2xl font-bold">Sending to Mother</h1>
      </header>

      <Card className="p-5">
        <dl className="space-y-3 text-sm">
          <Row label="You pay" value={`$${fromAmount.toFixed(2)} USD`} bold />
          <Row label="Exchange rate" value={`1 USD = ${rate.toFixed(2)} INR`} />
          <Row label="Fee" value={`$${fee.toFixed(2)}`} highlight="success" />
          <hr className="border-border" />
          <Row
            label="She receives"
            value={`₹${toAmount.toLocaleString()}`}
            bold
            size="lg"
          />
          <Row label="Arrives" value="Instant" />
        </dl>
      </Card>

      <Card className="border-success/30 bg-success/5 p-4">
        <p className="flex items-center gap-2 text-sm text-success-foreground">
          <Zap className="h-4 w-4 text-success" />
          <span className="text-foreground">
            You save{" "}
            <span className="font-semibold">${savedVsBank.toFixed(2)}</span> vs
            a typical bank.
          </span>
        </p>
      </Card>

      <div className="mt-auto space-y-2">
        {/* TODO(P1): POST to /api/transfer; show /history/[id] on success */}
        <Button asChild size="xl" variant="brand" className="w-full">
          <Link href="/history">
            <Check className="h-5 w-5" />
            Confirm with biometric
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/send">Edit amount</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  size,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  size?: "lg";
  highlight?: "success";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          (bold ? "font-semibold " : "") +
          (size === "lg" ? "text-xl " : "") +
          (highlight === "success" ? "text-success " : "") +
          "tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
