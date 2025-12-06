"use client";

import { Card } from "@/components/ui/card";

type Result = {
  id: string;
  temperature: number | null;
  gOriginal: number | null;
  gRtfo: number | null;
  gPav: number | null;
  pgHigh: number | null;
  pgLow: number | null;
  passFail: string | null;
  notes: string | null;
};

export function BinderTestResultsTable({ results }: { results: Result[] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Structured Test Results</h2>
        <p className="text-xs text-muted-foreground">DSR / PG data extracted or manually entered.</p>
      </div>
      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground">No structured results recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b text-[11px] text-muted-foreground">
                <th className="py-1 pr-3 text-left">Temp (°C)</th>
                <th className="py-1 px-3 text-left">G*/sinδ Original</th>
                <th className="py-1 px-3 text-left">G*/sinδ RTFO</th>
                <th className="py-1 px-3 text-left">G*/sinδ PAV</th>
                <th className="py-1 px-3 text-left">PG High</th>
                <th className="py-1 px-3 text-left">PG Low</th>
                <th className="py-1 px-3 text-left">Result</th>
                <th className="py-1 px-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-1 pr-3">{r.temperature ?? "—"}</td>
                  <td className="py-1 px-3">{r.gOriginal ?? "—"}</td>
                  <td className="py-1 px-3">{r.gRtfo ?? "—"}</td>
                  <td className="py-1 px-3">{r.gPav ?? "—"}</td>
                  <td className="py-1 px-3">{r.pgHigh ?? "—"}</td>
                  <td className="py-1 px-3">{r.pgLow ?? "—"}</td>
                  <td className="py-1 px-3">{r.passFail ?? "—"}</td>
                  <td className="py-1 px-3">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
