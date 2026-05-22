import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

// TODO(P3): fetch from /api/insights with streaming
export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Personalized financial guidance.
        </p>
      </header>

      <Card className="bg-gradient-to-br from-brand to-brand/70 text-brand-foreground">
        <div className="p-5">
          <Sparkles className="h-5 w-5 opacity-80" />
          <p className="mt-3 text-base leading-relaxed">
            Ravi, you&apos;ve sent <span className="font-semibold">$1,200</span>{" "}
            home this quarter. Saving{" "}
            <span className="font-semibold">$20/week</span> could build a{" "}
            <span className="font-semibold">$1,040 emergency fund</span> by
            year-end.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Suggested next step
        </p>
        <p className="mt-2 text-sm">
          Start a ₹100/week SIP into a low-cost index fund. Round-up your USD
          remittances and we&apos;ll move the change automatically.
        </p>
      </Card>
    </div>
  );
}
