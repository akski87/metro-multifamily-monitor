import { createFileRoute } from "@tanstack/react-router";
import { useSubmarket } from "@/lib/market-store";
import { SubmarketDashboard } from "@/components/submarket-dashboard";

type MarketSearch = {
  building?: string;
};

export const Route = createFileRoute("/market/$submarketId")({
  validateSearch: (s: Record<string, unknown>): MarketSearch => ({
    building:
      typeof s.building === "string" && s.building ? s.building : undefined,
  }),
  component: MarketPage,
});

function MarketPage() {
  const { submarketId } = Route.useParams();
  const { building } = Route.useSearch();
  const data = useSubmarket(submarketId);
  if (!data) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-xl font-semibold">Submarket not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          No data for “{submarketId}”. Add it under Manage markets, or check the
          id.
        </p>
      </div>
    );
  }
  return (
    <SubmarketDashboard
      key={data.id}
      data={data}
      initialBuildingId={building}
    />
  );
}
