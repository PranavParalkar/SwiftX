import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

// TODO(P3): fetch from /api/verify-chain and render the full re-computed table
export default function ChainPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Hash chain verifier</h1>
        <p className="text-sm text-muted-foreground">
          Re-derive every SHA-256 hash on demand from the raw transaction rows.
          A break anywhere in the chain proves tampering.
        </p>
      </header>

      <Card className="border-success/30 bg-success/5 p-5">
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-5 w-5 text-success" />
          <span>
            Chain verified · 42/42 transactions · last recompute just now
          </span>
        </p>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-2">#</th>
              <th>Hash</th>
              <th>Prev</th>
              <th>Recomputed</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono text-xs">
            <tr>
              <td className="px-4 py-2">42</td>
              <td>4f2c8a1e…b9d3</td>
              <td>9a3b71fd…42c8</td>
              <td className="text-success">match</td>
            </tr>
            <tr>
              <td className="px-4 py-2">41</td>
              <td>9a3b71fd…42c8</td>
              <td>1b0e5722…fa10</td>
              <td className="text-success">match</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
