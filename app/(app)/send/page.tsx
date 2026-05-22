import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SendPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <header>
        <h1 className="text-2xl font-bold">Send money</h1>
        <p className="text-sm text-muted-foreground">
          To family in India, instantly.
        </p>
      </header>

      {/* TODO(P2): wire to /api/fx for live preview as user types */}
      <form className="flex flex-1 flex-col gap-5" action="/send/confirm">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient phone</Label>
          <Input
            id="recipient"
            name="recipient"
            type="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
            defaultValue="+91 98765 43210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount in INR</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              placeholder="15000"
              defaultValue="15000"
              className="pl-8 text-lg"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Recipient gets this exact amount. We&apos;ll show the USD breakdown
            on the next screen.
          </p>
        </div>

        <Button
          type="submit"
          size="xl"
          variant="brand"
          className="mt-auto w-full"
        >
          See breakdown
        </Button>
      </form>
    </div>
  );
}
