import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { SubmarketSummary } from "@/lib/market-types";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/sparkline";
import { vacancyTextClass } from "@/lib/heat";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPct,
  formatPsf,
} from "@/lib/utils";
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpDown, ArrowUpRight } from "lucide-react";

type SortKey =
  | "name"
  | "market"
  | "buildings"
  | "units"
  | "available"
  | "availPct"
  | "asking"
  | "net"
  | "psf"
  | "conc"
  | "trend";

export function CompareTable({
  submarkets,
  activeId,
}: {
  submarkets: SubmarketSummary[];
  activeId?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("asking");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const rows = [...submarkets];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av =
        sortKey === "name"
          ? a.name
          : sortKey === "market"
            ? a.market_name
            : sortKey === "buildings"
              ? a.building_count
              : sortKey === "units"
                ? a.total_units
                : sortKey === "available"
                  ? a.available
                  : sortKey === "availPct"
                    ? a.avail_pct
                    : sortKey === "asking"
                      ? a.asking_avg ?? -1
                      : sortKey === "net"
                        ? a.net_avg ?? -1
                        : sortKey === "psf"
                          ? a.psf_avg ?? -1
                          : sortKey === "conc"
                            ? a.concession_avg
                            : a.trend_7d_ask ?? 0;
      const bv =
        sortKey === "name"
          ? b.name
          : sortKey === "market"
            ? b.market_name
            : sortKey === "buildings"
              ? b.building_count
              : sortKey === "units"
                ? b.total_units
                : sortKey === "available"
                  ? b.available
                  : sortKey === "availPct"
                    ? b.avail_pct
                    : sortKey === "asking"
                      ? b.asking_avg ?? -1
                      : sortKey === "net"
                        ? b.net_avg ?? -1
                        : sortKey === "psf"
                          ? b.psf_avg ?? -1
                          : sortKey === "conc"
                            ? b.concession_avg
                            : b.trend_7d_ask ?? 0;
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return rows;
  }, [submarkets, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "market" ? "asc" : "desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  const th =
    "sticky top-0 z-10 bg-bg-elevated px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle whitespace-nowrap cursor-pointer";

  return (
    <div className="panel overflow-hidden">
      <div className="max-h-[520px] overflow-auto scroll-thin">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(th, "text-left")} onClick={() => toggleSort("name")}>
                Submarket <SortIcon k="name" />
              </th>
              <th className={cn(th, "text-left")} onClick={() => toggleSort("market")}>
                Market <SortIcon k="market" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("buildings")}>
                Buildings <SortIcon k="buildings" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("units")}>
                Units <SortIcon k="units" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("available")}>
                Available <SortIcon k="available" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("availPct")}>
                Avail % <SortIcon k="availPct" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("asking")}>
                Asking <SortIcon k="asking" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("net")}>
                Net-eff <SortIcon k="net" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("psf")}>
                $/SF <SortIcon k="psf" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("conc")}>
                Conc. <SortIcon k="conc" />
              </th>
              <th className={cn(th, "text-right")} onClick={() => toggleSort("trend")}>
                7d / spark <SortIcon k="trend" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const active = s.id === activeId;
              const up = (s.trend_7d_ask ?? 0) > 0;
              const flat =
                s.trend_7d_ask == null || Math.abs(s.trend_7d_ask) < 0.05;
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
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular",
                      vacancyTextClass(s.avail_pct),
                    )}
                  >
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Sparkline values={s.spark_ask ?? []} />
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
                    </div>
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
