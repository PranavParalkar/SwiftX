import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TODO(P2): basket selector, round-up jar UI, SIP confirmation flow
export default function InvestPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Grow</h1>
        <p className="text-sm text-muted-foreground">
          Small steps. Big impact.
        </p>
      </header>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Round-up jar
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums">₹248</p>
        <p className="text-sm text-muted-foreground">
          Spare change from your last 7 transfers
        </p>
        <Button className="mt-4 w-full" variant="brand">
          Sweep into SIP
        </Button>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Start small
        </p>
        <p className="mt-2 text-sm">
          A ₹100/week SIP into a Nifty 50 index fund. Cancel anytime.
        </p>
        <Button className="mt-4 w-full" variant="outline">
          Start ₹100 SIP
        </Button>
      </Card>
    </div>
  );
}
