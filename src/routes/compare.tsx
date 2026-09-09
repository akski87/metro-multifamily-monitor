import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMarketsIndex } from "@/lib/market-store";
import { CompareTable } from "@/components/compare-table";
import { RentHeatmap } from "@/components/rent-heatmap";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const index = useMarketsIndex();
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return index.submarkets.filter((s) => {
      if (liveOnly && !s.live) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.market_name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    });
  }, [index.submarkets, liveOnly, query]);

  const liveCount = index.submarkets.filter((s) => s.live).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Cross-market
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Compare submarkets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Side-by-side rents, availability, concessions, and 7-day asking
            trends across the full portfolio — including markets you add.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter submarkets…"
              className="h-9 w-48 pl-8 sm:w-56"
              aria-label="Filter submarkets"
            />
          </div>
          <Button
            variant={liveOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLiveOnly((v) => !v)}
          >
            Live only
            <span className="text-fg-subtle">({liveCount})</span>
          </Button>
        </div>
      </div>

      <SectionHeader
        title="Asking rent heatmap"
        description="Unit-type asking averages. Darker cells are higher within that bedroom type. Availability is shaded separately."
      />
      <RentHeatmap submarkets={filtered} />

      <SectionHeader
        title="Competitive landscape"
        description={`${filtered.length} of ${index.submarkets.length} submarkets · snapshot ${index.as_of}`}
      />
      <CompareTable submarkets={filtered} />
    </div>
  );
}
