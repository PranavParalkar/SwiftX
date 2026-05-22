import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, FileText } from "lucide-react";

// TODO(P3): wire getUserMedia for selfie capture; supabase storage for upload
export default function KycPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Verify identity</h1>
        <p className="text-sm text-muted-foreground">
          Required to send remittances. Takes ~2 minutes.
        </p>
      </header>

      <Card className="border-success/30 bg-success/5 p-4">
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-5 w-5 text-success" />
          <span>RBI-compliant. Your documents are encrypted at rest.</span>
        </p>
      </Card>

      <KycStep
        icon={FileText}
        title="Government ID"
        subtitle="Passport, Emirates ID, or PAN card"
      />
      <KycStep
        icon={Camera}
        title="Selfie verification"
        subtitle="Tap to capture a live photo"
      />

      <Button size="xl" variant="brand" className="mt-4 w-full" disabled>
        Submit for review
      </Button>
    </div>
  );
}

function KycStep({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Camera;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Button size="sm" variant="outline">
        Upload
      </Button>
    </Card>
  );
}
