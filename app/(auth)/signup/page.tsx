import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="pt-4">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start sending money home in minutes.
        </p>
      </header>

      {/* TODO(P1): wire to supabase.auth.signUp + create profile row */}
      <form className="mt-8 space-y-4" action="/kyc">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            placeholder="As on your government ID"
            autoComplete="name"
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="country">I'm based in</Label>
          <select
            id="country"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="AE"
          >
            <option value="AE">United Arab Emirates</option>
            <option value="US">United States</option>
            <option value="IN">India</option>
          </select>
        </div>
        <Button type="submit" size="xl" variant="brand" className="w-full">
          Continue to KYC
        </Button>
      </form>

      <div className="mt-auto pt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
