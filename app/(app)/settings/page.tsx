import { Card } from "@/components/ui/card";
import { Globe, Shield, LogOut } from "lucide-react";

// TODO(P2): hook language toggle to next-intl + persist on profile
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Account</h1>
      </header>

      <Card className="p-4">
        <p className="text-sm font-medium">Ravi Kumar</p>
        <p className="text-xs text-muted-foreground">+971 50 123 4567</p>
        <p className="mt-1 text-xs text-success">Verified</p>
      </Card>

      <SettingRow icon={Globe} label="Language" value="English" />
      <SettingRow icon={Shield} label="Privacy & audit log" />
      <SettingRow icon={LogOut} label="Sign out" destructive />
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  destructive,
}: {
  icon: typeof Globe;
  label: string;
  value?: string;
  destructive?: boolean;
}) {
  return (
    <Card
      className={`flex items-center gap-3 p-4 ${
        destructive ? "text-destructive" : ""
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? (
        <span className="text-sm text-muted-foreground">{value}</span>
      ) : null}
    </Card>
  );
}
