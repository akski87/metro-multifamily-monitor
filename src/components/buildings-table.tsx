import { useMemo, useState } from "react";
import type { Building } from "@/lib/market-types";
import {
  buildingAskingPsf,
  buildingNetPsf,
} from "@/lib/market-data";
import { cn, formatNumber, formatPct, formatPsf } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortKey =
  | "name"
  | "units"
  | "available"
  | "availPct"
  | "askPsf"
  | "netPsf"
  | "concession";

export function BuildingsTable({
  buildings,
  inMarketIds,
  onToggle,
  selectedId,
  onSelect,
}: {
  buildings: Building[];
  inMarketIds: Set<string>;
  onToggle: (id: string, next: boolean) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("available");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const mapped = buildings.map((b) => {
      const available = b.available_now ?? 0;
      const availPct = b.units ? (available / b.units) * 100 : 0;
      return {
        b,
        available,
        availPct,
        askPsf: buildingAskingPsf(b),
        netPsf: buildingNetPsf(b),
        concession: (b.concession_pct ?? b.conc_derived_pct ?? 0) * 100,
      };
    });
    const dir = sortDir === "asc" ? 1 : -1;
    mapped.sort((a, b) => {
      const av =
        sortKey === "name"
          ? a.b.name
          : sortKey === "units"
            ? a.b.units
            : sortKey === "available"
              ? a.available
              : sortKey === "availPct"
                ? a.availPct
                : sortKey === "askPsf"
                  ? a.askPsf ?? -1
                  : sortKey === "netPsf"
                    ? a.netPsf ?? -1
                    : a.concession;
      const bv =
        sortKey === "name"
          ? b.b.name
          : sortKey === "units"
            ? b.b.units
            : sortKey === "available"
              ? b.available
              : sortKey === "availPct"
                ? b.availPct
                : sortKey === "askPsf"
                  ? b.askPsf ?? -1
                  : sortKey === "netPsf"
                    ? b.netPsf ?? -1
                    : b.concession;
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return mapped;
  }, [buildings, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
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
    "sticky top-0 z-10 bg-bg-elevated px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-subtle whitespace-nowrap";

  return (
    <div className="panel overflow-hidden">
      <div className="max-h-[420px] overflow-auto scroll-thin">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>In mkt</th>
              <th className={cn(th, "cursor-pointer")} onClick={() => toggleSort("name")}>
                Building <SortIcon k="name" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("units")}>
                Units <SortIcon k="units" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("available")}>
                Avail <SortIcon k="available" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("availPct")}>
                Avail % <SortIcon k="availPct" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("askPsf")}>
                Mkt $/SF <SortIcon k="askPsf" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("netPsf")}>
                Net-Eff $/SF <SortIcon k="netPsf" />
              </th>
              <th className={cn(th, "cursor-pointer text-right")} onClick={() => toggleSort("concession")}>
                Conc. <SortIcon k="concession" />
              </th>
              <th className={th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, available, availPct, askPsf, netPsf, concession }) => {
              const inMkt = inMarketIds.has(b.id);
              const selected = selectedId === b.id;
              return (
                <tr
                  key={b.id}
                  className={cn(
                    "border-b border-border/70 transition-colors hover:bg-bg-subtle/80",
                    selected && "bg-accent-soft/40",
                    !inMkt && "opacity-55",
                  )}
                  onClick={() => onSelect?.(b.id)}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={inMkt}
                      onCheckedChange={(v) => onToggle(b.id, v)}
                      aria-label={`Toggle ${b.name} in market`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-fg">{b.name}</div>
                    <div className="text-xs text-fg-subtle">{b.address}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatNumber(b.units)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular font-medium">
                    {formatNumber(available)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-fg-muted">
                    {formatPct(availPct)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {formatPsf(askPsf)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-fg-muted">
                    {formatPsf(netPsf)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {concession > 0 ? (
                      <span className="tabular text-warning">
                        {formatPct(concession)}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                    {b.concession_text ? (
                      <div className="mt-0.5 max-w-[140px] truncate text-[10px] text-fg-subtle" title={b.concession_text}>
                        {b.concession_text}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-fg-subtle">
                    {b.method ?? "—"}
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
