import { Link } from "@tanstack/react-router";
import type { SubmarketSummary } from "@/lib/market-types";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPct,
  formatPsf,
} from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function CompareTable({
  submarkets,
  activeId,
}: {
  submarkets: SubmarketSummary[];
  activeId?: string;
}) {
  const sorted = [...submarkets].sort(
    (a, b) => (b.asking_avg ?? 0) - (a.asking_avg ?? 0),
  );

  return (
    <div className="panel overflow-hidden">
      <div className="max-h-[520px] overflow-auto scroll-thin">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                "Submarket",
                "Market",
                "Buildings",
                "Units",
                "Available",
                "Avail %",
                "Asking",
                "Net-eff",
                "$/SF",
                "Conc.",
                "7d trend",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "sticky top-0 z-10 bg-bg-elevated px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle",
                    i === 0 || i === 1 ? "text-left" : "text-right",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const active = s.id === activeId;
              const up = (s.trend_7d_ask ?? 0) > 0;
              const flat = s.trend_7d_ask == null || Math.abs(s.trend_7d_ask) < 0.05;
              return (
                <tr
                  key={s.id}
                  className={cn(
                    "border-b border-border/70 transition-colors hover:bg-bg-subtle/80",
                    active && "bg-accent-soft/50",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <Link
                      to="/market/$submarketId"
                      params={{ submarketId: s.id }}
                      className="font-medium text-fg hover:text-accent"
                    >
                      {s.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs text-fg-subtle">
                        {s.city}, {s.state}
                      </span>
                      {s.live ? (
                        <Badge variant="live">Live</Badge>
                      ) : (
                        <Badge variant="demo">Demo</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted">{s.market_name}</td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatNumber(s.building_count)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatNumber(s.total_units)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular font-medium">
                    {formatNumber(s.available)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-fg-muted">
                    {formatPct(s.avail_pct)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatCurrency(s.asking_avg)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-fg-muted">
                    {formatCurrency(s.net_avg)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatPsf(s.psf_avg)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-warning">
                    {s.concession_avg > 0 ? formatPct(s.concession_avg) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {flat ? (
                      <span className="text-fg-subtle">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 tabular font-medium",
                          up ? "text-negative" : "text-positive",
                        )}
                      >
                        {up ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {formatPct(Math.abs(s.trend_7d_ask ?? 0))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
