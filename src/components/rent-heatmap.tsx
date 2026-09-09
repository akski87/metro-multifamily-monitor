import { Link } from "@tanstack/react-router";
import type { SubmarketSummary } from "@/lib/market-types";
import { UNIT_TYPES } from "@/lib/market-types";
import { heatMix } from "@/lib/heat";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function RentHeatmap({ submarkets }: { submarkets: SubmarketSummary[] }) {
  const extents = Object.fromEntries(
    UNIT_TYPES.map((t) => {
      const vals = submarkets
        .map((s) => s.by_type?.[t]?.asking)
        .filter((v): v is number => typeof v === "number" && v > 0);
      const min = vals.length ? Math.min(...vals) : 0;
      const max = vals.length ? Math.max(...vals) : 0;
      return [t, { min, max }];
    }),
  ) as Record<(typeof UNIT_TYPES)[number], { min: number; max: number }>;

  const availVals = submarkets.map((s) => s.avail_pct);
  const availMin = availVals.length ? Math.min(...availVals) : 0;
  const availMax = availVals.length ? Math.max(...availVals) : 0;

  if (!submarkets.length) {
    return (
      <div className="panel p-8 text-center text-sm text-fg-muted">
        No submarkets to compare.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-bg-elevated px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Submarket
              </th>
              {UNIT_TYPES.map((t) => (
                <th
                  key={t}
                  className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
                >
                  {t}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Avail %
              </th>
            </tr>
          </thead>
          <tbody>
            {submarkets.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="sticky left-0 z-10 bg-bg-elevated px-3 py-2">
                  <Link
                    to="/market/$submarketId"
                    params={{ submarketId: s.id }}
                    className="font-medium text-fg hover:text-accent"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs text-fg-subtle">{s.market_name}</span>
                    {s.live ? (
                      <Badge variant="live" className="px-1.5 py-0 text-[10px]">
                        Live
                      </Badge>
                    ) : null}
                  </div>
                </td>
                {UNIT_TYPES.map((t) => {
                  const v = s.by_type?.[t]?.asking ?? null;
                  const ext = extents[t];
                  const span = ext.max - ext.min || 1;
                  const rank = v != null ? (v - ext.min) / span : 0;
                  return (
                    <td key={t} className="px-1.5 py-1.5">
                      <div
                        className={cn(
                          "rounded-md px-2 py-1.5 text-right tabular",
                          v == null && "text-fg-subtle",
                        )}
                        style={
                          v != null
                            ? {
                                background: `color-mix(in oklab, var(--color-accent) ${heatMix(rank)}%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        {formatCurrency(v)}
                      </div>
                    </td>
                  );
                })}
                <td className="px-1.5 py-1.5">
                  <div
                    className="rounded-md px-2 py-1.5 text-right tabular"
                    style={{
                      background: `color-mix(in oklab, var(--color-warning) ${heatMix(
                        (s.avail_pct - availMin) / (availMax - availMin || 1),
                      )}%, transparent)`,
                    }}
                  >
                    {formatPct(s.avail_pct)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
