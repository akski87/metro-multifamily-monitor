import { useEffect } from "react";
import {
  Building2,
  ExternalLink,
  MapPin,
  Star,
  X,
} from "lucide-react";
import type { Building } from "@/lib/market-types";
import { UNIT_TYPES } from "@/lib/market-types";
import { buildingAskingPsf, buildingNetPsf } from "@/lib/market-data";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPct,
  formatPsf,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/sparkline";

export function BuildingSheet({
  building,
  open,
  onOpenChange,
  watched,
  onToggleWatch,
}: {
  building: Building | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watched?: boolean;
  onToggleWatch?: () => void;
}) {
  const b = building;
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !b) return null;

  const avail = b.available_now ?? 0;
  const availPct = b.units ? (avail / b.units) * 100 : 0;
  const conc = (b.concession_pct ?? b.conc_derived_pct ?? 0) * 100;
  const spark = (b.history ?? []).slice(-14).map((h) => h.ne ?? 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-bg/60"
        aria-label="Close building details"
        onClick={() => onOpenChange(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="building-sheet-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-bg-elevated shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2
              id="building-sheet-title"
              className="text-lg font-semibold tracking-tight"
            >
              {b.name}
            </h2>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-fg-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {b.address}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onToggleWatch ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleWatch}
                aria-label={watched ? "Unwatch" : "Watch"}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    watched && "fill-warning text-warning",
                  )}
                />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {b.mgmt ? <Badge variant="outline">{b.mgmt}</Badge> : null}
            {b.year_built ? (
              <Badge variant="outline">{b.year_built}</Badge>
            ) : null}
            {b.stories ? (
              <Badge variant="outline">{b.stories} fl</Badge>
            ) : null}
            {b.method ? <Badge variant="outline">{b.method}</Badge> : null}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <Stat label="Units" value={formatNumber(b.units)} />
            <Stat
              label="Available"
              value={`${formatNumber(avail)} · ${formatPct(availPct)}`}
            />
            <Stat label="Mkt $/SF" value={formatPsf(buildingAskingPsf(b))} />
            <Stat label="Net-eff $/SF" value={formatPsf(buildingNetPsf(b))} />
          </div>

          {spark.length > 2 ? (
            <div className="mb-5">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Net-eff trend
              </p>
              <Sparkline values={spark} className="h-8 w-full" />
            </div>
          ) : null}

          {conc > 0 || b.concession_text ? (
            <div className="mb-5 rounded-lg border border-border bg-bg-subtle/60 px-3 py-2.5">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Concession
              </p>
              <p className="tabular text-sm text-warning">
                {conc > 0 ? formatPct(conc) : "Unquantified"}
              </p>
              {b.concession_text ? (
                <p className="mt-1 text-xs text-fg-muted">{b.concession_text}</p>
              ) : null}
            </div>
          ) : null}

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
            By unit type
          </p>
          <table className="mb-5 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-fg-subtle">
                <th className="py-1.5 font-medium">Type</th>
                <th className="py-1.5 text-right font-medium">n</th>
                <th className="py-1.5 text-right font-medium">Ask</th>
                <th className="py-1.5 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {UNIT_TYPES.map((t) => {
                const m = b.by_type?.[t];
                if (!m) return null;
                return (
                  <tr key={t} className="border-t border-border/70">
                    <td className="py-1.5">{t}</td>
                    <td className="py-1.5 text-right tabular">{m.count}</td>
                    <td className="py-1.5 text-right tabular">
                      {formatCurrency(m.asking_avg)}
                    </td>
                    <td className="py-1.5 text-right tabular text-chart-2">
                      {formatCurrency(m.net_avg)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {b.unit_mix ? (
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                Unit mix
              </p>
              <p className="text-sm text-fg-muted">
                Studio {b.unit_mix.studio} · 1BR {b.unit_mix.br1} · 2BR{" "}
                {b.unit_mix.br2} · 3BR {b.unit_mix.br3}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {b.source_url ? (
              <a
                href={b.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                Availability page <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {b.portal_url ? (
              <a
                href={b.portal_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                Leasing portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {!b.source_url && !b.portal_url ? (
              <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
                <Building2 className="h-3.5 w-3.5" />
                No public listing URL on file
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-subtle/50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <p className="mt-0.5 tabular text-sm font-medium">{value}</p>
    </div>
  );
}
