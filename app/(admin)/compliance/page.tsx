import { Card } from "@/components/ui/card";

// TODO(P1): load real aml_flags + transactions via admin client
export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Compliance dashboard</h1>
        <p className="text-sm text-muted-foreground">
          AML flags and audit trail.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Transactions today" value="42" />
        <Stat label="Open flags" value="3" />
        <Stat label="Volume (USD)" value="$28,140" />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Recent flags</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2">Tx</th>
              <th>Rule</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="py-2 font-mono text-xs">#42</td>
              <td>velocity_count</td>
              <td>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  medium
                </span>
              </td>
              <td className="text-muted-foreground">Pending review</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}
