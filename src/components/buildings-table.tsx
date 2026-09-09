import { useMemo, useState } from "react";
import type { Building } from "@/lib/market-types";
import { buildingAskingPsf, buildingNetPsf } from "@/lib/market-data";
import { buildingsToCsv, downloadCsv } from "@/lib/export-csv";
import { vacancyTextClass } from "@/lib/heat";
import { cn, formatNumber, formatPct, formatPsf } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

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
  watchedIds,
  onToggleWatch,
  exportName = "buildings",
}: {
  buildings: Building[];
  inMarketIds: Set<string>;
  onToggle: (id: string, next: boolean) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  watchedIds?: Set<string>;
  onToggleWatch?: (id: string) => void;
  exportName?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("available");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");
  const [watchedOnly, setWatchedOnly] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped = buildings
      .filter((b) => {
        if (watchedOnly && watchedIds && !watchedIds.has(b.id)) return false;
        if (!q) return true;
        return (
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          (b.mgmt ?? "").toLowerCase().includes(q)
        );
      })
      .map((b) => {
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
  }, [buildings, sortKey, sortDir, query, watchedOnly, watchedIds]);

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

  function exportCsv() {
    const subset = rows.map((r) => r.b);
    downloadCsv(`${exportName}-buildings.csv`, buildingsToCsv(subset));
    toast.success(`Exported ${subset.length} buildings`);
  }

  const th =
    "sticky top-0 z-10 bg-bg-elevated px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-subtle whitespace-nowrap";

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buildings…"
            className="h-9 pl-8"
            aria-label="Search buildings"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {watchedIds ? (
            <Button
              variant={watchedOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setWatchedOnly((v) => !v)}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  watchedOnly && "fill-warning text-warning",
                )}
              />
              Watched
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <span className="text-xs text-fg-subtle">
            {rows.length} of {buildings.length}
          </span>
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto scroll-thin">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>In mkt</th>
              <th
                className={cn(th, "cursor-pointer")}
                onClick={() => toggleSort("name")}
              >
                Building <SortIcon k="name" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("units")}
              >
                Units <SortIcon k="units" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("available")}
              >
                Avail <SortIcon k="available" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("availPct")}
              >
                Avail % <SortIcon k="availPct" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("askPsf")}
              >
                Mkt $/SF <SortIcon k="askPsf" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("netPsf")}
              >
                Net-eff $/SF <SortIcon k="netPsf" />
              </th>
              <th
                className={cn(th, "cursor-pointer text-right")}
                onClick={() => toggleSort("concession")}
              >
                Conc. <SortIcon k="concession" />
              </th>
              <th className={th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, available, availPct, askPsf, netPsf, concession }) => {
              const inMkt = inMarketIds.has(b.id);
              const selected = selectedId === b.id;
              const watched = watchedIds?.has(b.id) ?? false;
              return (
                <tr
                  key={b.id}
                  className={cn(
                    "cursor-pointer border-b border-border/70 transition-colors hover:bg-bg-subtle/80",
                    selected && "bg-accent-soft/40",
                    !inMkt && "opacity-55",
                  )}
                  onClick={() => onSelect?.(b.id)}
                >
                  <td
                    className="px-3 py-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={inMkt}
                        onCheckedChange={(v) => onToggle(b.id, v)}
                        aria-label={`Toggle ${b.name} in market`}
                      />
                      {onToggleWatch ? (
                        <button
                          type="button"
                          className="rounded-md p-1 text-fg-subtle hover:text-warning"
                          aria-label={watched ? "Unwatch" : "Watch"}
                          onClick={() => onToggleWatch(b.id)}
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              watched && "fill-warning text-warning",
                            )}
                          />
                        </button>
                      ) : null}
                    </div>
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
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular",
                      vacancyTextClass(availPct),
                    )}
                  >
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
                      <div
                        className="mt-0.5 max-w-[140px] truncate text-[10px] text-fg-subtle"
                        title={b.concession_text}
                      >
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-10 text-center text-sm text-fg-muted"
                >
                  No buildings match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
