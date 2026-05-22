import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="pt-4">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your phone number to receive a one-time code.
        </p>
      </header>

      {/* TODO(P1): wire to supabase.auth.signInWithOtp */}
      <form className="mt-8 space-y-4" action="/home">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+971 50 123 4567"
            autoComplete="tel"
          />
        </div>
        <Button type="submit" size="xl" variant="brand" className="w-full">
          Send code
        </Button>
      </form>

      <div className="mt-auto pt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-foreground underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
