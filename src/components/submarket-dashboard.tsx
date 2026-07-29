import { useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  Percent,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { SubmarketData, UnitType } from "@/lib/market-types";
import { UNIT_TYPES } from "@/lib/market-types";
import { aggregateBuildings } from "@/lib/market-data";
import { useMarketList } from "@/lib/market-store";
import {
  formatCurrency,
  formatNumber,
  formatPct,
  formatPsf,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeader } from "@/components/section-header";
import { TrendChart } from "@/components/trend-chart";
import { RentBars } from "@/components/rent-bars";
import { BuildingRentBars } from "@/components/building-rent-bars";
import { UnitMixChart } from "@/components/unit-mix-chart";
import { BuildingMap } from "@/components/building-map";
import { BuildingsTable } from "@/components/buildings-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SubmarketDashboard({ data }: { data: SubmarketData }) {
  const markets = useMarketList();
  const market = markets.find((m) => m.id === data.market_id) ?? null;
  const [inMarketIds, setInMarketIds] = useState<Set<string>>(
    () =>
      new Set(
        data.buildings.filter((b) => b.in_market !== false).map((b) => b.id),
      ),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unitType, setUnitType] = useState<UnitType | "All">("Studio");

  const agg = useMemo(
    () => aggregateBuildings(data.buildings, inMarketIds),
    [data.buildings, inMarketIds],
  );

  const hist = data.market_history;
  const last = hist[hist.length - 1];
  const weekAgo = hist.length >= 8 ? hist[hist.length - 8] : hist[0];
  const askDelta =
    last && weekAgo && weekAgo.all_asking
      ? ((last.all_asking - weekAgo.all_asking) / weekAgo.all_asking) * 100
      : null;
  const availDelta =
    last && weekAgo
      ? last.total_available - weekAgo.total_available
      : null;

  function toggleBuilding(id: string, next: boolean) {
    setInMarketIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  const allRow = agg.survey.find((r) => r.type === "All");

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {market?.name ?? data.market_id} · {data.state}
            </Badge>
            {data.live ? (
              <Badge variant="live">Live feed</Badge>
            ) : data.custom ? (
              <Badge variant="demo">Custom</Badge>
            ) : (
              <Badge variant="demo">Demo comps</Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {data.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            {data.description} Snapshot {data.as_of}. Averages use buildings
            flagged in-market below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setInMarketIds(new Set(data.buildings.map((b) => b.id)))
            }
          >
            Include all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInMarketIds(new Set())}
          >
            Clear set
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="In-market units"
          value={formatNumber(agg.totalUnits)}
          hint={`${agg.buildingsIn.length} of ${data.buildings.length} buildings`}
          icon={Building2}
        />
        <KpiCard
          label="Available now"
          value={formatNumber(agg.available)}
          hint={`${formatPct(agg.availPct)} vacancy in set`}
          delta={
            availDelta != null
              ? {
                  value: `${availDelta > 0 ? "+" : ""}${availDelta} vs 7d`,
                  positive:
                    availDelta < 0 ? true : availDelta > 0 ? false : null,
                }
              : undefined
          }
          icon={BedDouble}
        />
        <KpiCard
          label="Asking avg"
          value={formatCurrency(agg.askingAvg ?? last?.all_asking)}
          hint={`Net-eff ${formatCurrency(agg.netAvg ?? last?.all_net)}`}
          delta={
            askDelta != null
              ? {
                  value: `${askDelta > 0 ? "+" : ""}${askDelta.toFixed(1)}% 7d`,
                  positive: askDelta < 0 ? true : askDelta > 0 ? false : null,
                }
              : undefined
          }
          icon={askDelta != null && askDelta > 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard
          label="Avg concession"
          value={
            agg.concessionAvg != null ? formatPct(agg.concessionAvg) : "—"
          }
          hint={`Mkt $/SF ${formatPsf(agg.psfAvg)}`}
          icon={Tag}
        />
      </div>

      <section>
        <SectionHeader
          eyebrow="01"
          title="Live market survey"
          description="Listing roll-up by unit type for the in-market set. Net-effective uses stated or derived concessions where available."
        />
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-fg-subtle">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Listings</th>
                  <th className="px-4 py-3 text-right font-medium">Ask min</th>
                  <th className="px-4 py-3 text-right font-medium">Ask avg</th>
                  <th className="px-4 py-3 text-right font-medium">Ask max</th>
                  <th className="px-4 py-3 text-right font-medium">SF avg</th>
                  <th className="px-4 py-3 text-right font-medium">$/SF</th>
                  <th className="px-4 py-3 text-right font-medium">Net-eff</th>
                </tr>
              </thead>
              <tbody>
                {agg.survey.map((row) => (
                  <tr
                    key={row.type}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium">{row.type}</td>
                    <td className="px-4 py-2.5 text-right tabular">
                      {formatNumber(row.count)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-fg-muted">
                      {formatCurrency(row.askingMin)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular font-medium">
                      {formatCurrency(row.askingAvg)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-fg-muted">
                      {formatCurrency(row.askingMax)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-fg-muted">
                      {row.sqftAvg != null
                        ? formatNumber(Math.round(row.sqftAvg))
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular">
                      {formatPsf(row.askingPsf)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-chart-2">
                      {formatCurrency(row.netAvg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allRow ? (
            <div className="border-t border-border bg-bg-subtle/50 px-4 py-3 text-xs text-fg-subtle">
              Effective discount off asking is read from each building at pull
              time. No advertised concession → net = asking.
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader
            eyebrow="02"
            title="Rents by unit type"
            description="Asking vs net-effective. Labels show annualized $/SF where footage is known."
          />
          <div className="panel p-4 sm:p-5">
            <RentBars data={agg.byTypeBars} />
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="03"
            title="Rent & availability trend"
            description="Daily market series as snapshots accumulate."
          />
          <div className="panel p-4 sm:p-5">
            {data.market_history.length > 0 ? (
              <TrendChart history={data.market_history} />
            ) : (
              <p className="py-12 text-center text-sm text-fg-muted">
                No history yet.
              </p>
            )}
          </div>
        </section>
      </div>

      <section>
        <SectionHeader
          eyebrow="04"
          title="Rents by building"
          description="Net-effective with concession delta shaded. Pick a unit type to compare comps."
          action={
            <Tabs
              value={unitType}
              onValueChange={(v) => setUnitType(v as UnitType | "All")}
            >
              <TabsList className="h-9">
                <TabsTrigger value="All" className="px-2.5 text-xs">
                  All
                </TabsTrigger>
                {UNIT_TYPES.map((t) => (
                  <TabsTrigger key={t} value={t} className="px-2.5 text-xs">
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        />
        <div className="panel p-4 sm:p-5">
          {agg.buildingsIn.length > 0 ? (
            <BuildingRentBars
              buildings={agg.buildingsIn}
              unitType={unitType}
              height={Math.max(280, agg.buildingsIn.length * 28)}
            />
          ) : (
            <p className="py-12 text-center text-sm text-fg-muted">
              No buildings in the competitive set.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader
            eyebrow="05"
            title="Unit mix"
            description="Bedroom census across in-market buildings with sourced or estimated mixes."
          />
          <div className="panel p-4 sm:p-5">
            {agg.unitMix.total > 0 ? (
              <UnitMixChart mix={agg.unitMix} />
            ) : (
              <p className="py-12 text-center text-sm text-fg-muted">
                Unit mix not available.
              </p>
            )}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="06"
            title="The map"
            description="Click a marker for a live read. Size scales with unit count."
          />
          <BuildingMap
            buildings={data.buildings}
            inMarketIds={inMarketIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
      </div>

      <section>
        <SectionHeader
          eyebrow="07"
          title="The building set"
          description="Toggle in-market to recompute averages above. Sort any column."
        />
        {data.buildings.length > 0 ? (
          <BuildingsTable
            buildings={data.buildings}
            inMarketIds={inMarketIds}
            onToggle={toggleBuilding}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="panel p-8 text-center text-sm text-fg-muted">
            No buildings yet. Import survey JSON from Add markets.
          </div>
        )}
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHeader eyebrow="08" title="Read-out" className="mb-3" />
        <div className="grid gap-4 text-sm text-fg-muted sm:grid-cols-2 lg:grid-cols-3">
          <ReadItem
            label="Competitive set"
            value={`${agg.buildingsIn.length} buildings · ${formatNumber(agg.totalUnits)} units`}
          />
          <ReadItem
            label="Availability"
            value={`${formatNumber(agg.available)} units on market (${formatPct(agg.availPct)})`}
          />
          <ReadItem
            label="Asking / net"
            value={`${formatCurrency(agg.askingAvg ?? last?.all_asking)} ask · ${formatCurrency(agg.netAvg ?? last?.all_net)} net`}
          />
          <ReadItem
            label="Concessions"
            value={
              agg.concessionAvg != null
                ? `Avg ${formatPct(agg.concessionAvg)} effective off asking`
                : "Limited quantified concessions"
            }
          />
          <ReadItem
            label="Data quality"
            value={
              data.data_quality.warnings?.length
                ? `${data.data_quality.warnings.length} warning(s)`
                : "No open warnings"
            }
          />
          <ReadItem
            label="Coverage"
            value={
              data.live
                ? "Live daily ingest"
                : data.custom
                  ? "Custom addition"
                  : "Demo multi-market expansion set"
            }
          />
        </div>
        {data.data_quality.warnings?.length ? (
          <ul className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-warning">
            {data.data_quality.warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <Percent className="mt-0.5 h-3 w-3 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function ReadItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <p className="mt-1 text-fg">{value}</p>
    </div>
  );
}
