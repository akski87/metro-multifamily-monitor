import { createFileRoute } from "@tanstack/react-router";
import { useMarketsIndex } from "@/lib/market-store";
import { CompareTable } from "@/components/compare-table";
import { SectionHeader } from "@/components/section-header";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const index = useMarketsIndex();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
          Cross-market
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Compare submarkets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Side-by-side rents, availability, concessions, and 7-day asking trends
          across the full portfolio — including markets you add.
        </p>
      </div>
      <SectionHeader
        title="Competitive landscape"
        description={`${index.submarkets.length} submarkets · snapshot ${index.as_of}`}
      />
      <CompareTable submarkets={index.submarkets} />
    </div>
  );
}
