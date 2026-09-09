import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  FolderPlus,
  MapPinned,
  Star,
} from "lucide-react";
import { useAllSubmarkets, useMarketsIndex } from "@/lib/market-store";
import { useWatchlist } from "@/lib/watchlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeader } from "@/components/section-header";
import { CompareTable } from "@/components/compare-table";
import { Sparkline } from "@/components/sparkline";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPct,
} from "@/lib/utils";
import { vacancyTextClass } from "@/lib/heat";
import { buildingAskingPsf } from "@/lib/market-data";

export function PortfolioView() {
  const index = useMarketsIndex();
  const allSubs = useAllSubmarkets();
  const watch = useWatchlist();
  const subs = index.submarkets;
  const totalUnits = subs.reduce((a, s) => a + s.total_units, 0);
  const totalAvail = subs.reduce((a, s) => a + s.available, 0);
  const totalBldgs = subs.reduce((a, s) => a + s.building_count, 0);
  const liveCount = subs.filter((s) => s.live).length;
  const customCount = subs.filter((s) => s.custom).length;
  const avgAsk =
    subs.reduce((a, s) => a + (s.asking_avg ?? 0), 0) /
    (subs.filter((s) => s.asking_avg).length || 1);

  const rentBars = [...subs]
    .sort((a, b) => (b.asking_avg ?? 0) - (a.asking_avg ?? 0))
    .map((s) => ({
      name: s.name.length > 16 ? s.name.slice(0, 14) + "…" : s.name,
      full: s.name,
      asking: s.asking_avg ?? 0,
      net: s.net_avg ?? 0,
      market: s.market_name,
    }));

  const availBars = [...subs]
    .sort((a, b) => b.avail_pct - a.avail_pct)
    .map((s) => ({
      name: s.name.length > 16 ? s.name.slice(0, 14) + "…" : s.name,
      full: s.name,
      avail: s.avail_pct,
    }));

  const watchedBuildings = useMemo(() => {
    const set = new Set(watch.ids);
    if (!set.size) return [];
    const out: Array<{
      id: string;
      name: string;
      submarketId: string;
      submarketName: string;
      available: number;
      units: number;
      psf: number | null;
    }> = [];
    for (const sm of allSubs) {
      for (const b of sm.buildings) {
        if (!set.has(b.id)) continue;
        out.push({
          id: b.id,
          name: b.name,
          submarketId: sm.id,
          submarketName: sm.name,
          available: b.available_now ?? 0,
          units: b.units,
          psf: buildingAskingPsf(b),
        });
      }
    }
    return out;
  }, [allSubs, watch.ids]);

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
            Portfolio overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Metro multifamily markets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Cross-market monitor spanning Hudson County, Manhattan, Brooklyn, and
            Queens — plus any markets you add. Journal Square is live; use{" "}
            <Link to="/manage" className="text-accent hover:underline">
              Add markets
            </Link>{" "}
            to expand coverage. Press ⌘K to jump anywhere.
          </p>
        </div>
        <Button asChild variant="secondary" className="shrink-0 self-start">
          <Link to="/manage">
            <FolderPlus className="h-4 w-4" />
            Add market
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="Submarkets"
          value={formatNumber(subs.length)}
          hint={`${index.markets.length} parent · ${liveCount} live${customCount ? ` · ${customCount} custom` : ""}`}
          icon={MapPinned}
        />
        <KpiCard
          label="Buildings tracked"
          value={formatNumber(totalBldgs)}
          hint={`${formatNumber(totalUnits)} total units`}
          icon={Building2}
        />
        <KpiCard
          label="Units available"
          value={formatNumber(totalAvail)}
          hint={`${formatPct((totalAvail / (totalUnits || 1)) * 100)} portfolio vacancy`}
        />
        <KpiCard
          label="Avg asking (unweighted)"
          value={formatCurrency(avgAsk)}
          hint="Mean of submarket averages"
        />
      </div>

      {watchedBuildings.length > 0 ? (
        <section>
          <SectionHeader
            title="Watchlist"
            description="Starred buildings persist in this browser. Open a row to jump to the sheet."
          />
          <div className="panel overflow-hidden">
            <ul className="divide-y divide-border">
              {watchedBuildings.map((b) => {
                const pct = b.units ? (b.available / b.units) * 100 : 0;
                return (
                  <li key={b.id}>
                    <Link
                      to="/market/$submarketId"
                      params={{ submarketId: b.submarketId }}
                      search={{ building: b.id }}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-bg-subtle"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                        <span className="truncate font-medium">{b.name}</span>
                        <span className="truncate text-xs text-fg-subtle">
                          {b.submarketName}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-4 tabular text-xs">
                        <span className={vacancyTextClass(pct)}>
                          {formatNumber(b.available)} avail
                        </span>
                        <span className="text-fg-muted">
                          {b.psf != null ? `$${b.psf.toFixed(1)} /SF` : "—"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="Markets"
          description="Drill into a submarket for building-level survey, trends, and the competitive set."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {index.markets.map((m) => {
            const children = subs.filter((s) => s.market_id === m.id);
            const units = children.reduce((a, s) => a + s.total_units, 0);
            const avail = children.reduce((a, s) => a + s.available, 0);
            const asks = children
              .map((s) => s.asking_avg)
              .filter((v): v is number => v != null);
            const avg =
              asks.reduce((a, b) => a + b, 0) / (asks.length || 1);
            return (
              <div key={m.id} className="panel flex flex-col p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold tracking-tight">{m.name}</h3>
                    <p className="text-xs text-fg-subtle">
                      {m.region || "—"} · {m.state}
                      {m.custom ? " · custom" : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{children.length}</Badge>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="panel-inner px-2.5 py-2">
                    <p className="text-fg-subtle">Units</p>
                    <p className="mt-0.5 tabular font-medium">
                      {formatNumber(units)}
                    </p>
                  </div>
                  <div className="panel-inner px-2.5 py-2">
                    <p className="text-fg-subtle">Asking</p>
                    <p className="mt-0.5 tabular font-medium">
                      {formatCurrency(avg)}
                    </p>
                  </div>
                  <div className="panel-inner col-span-2 px-2.5 py-2">
                    <p className="text-fg-subtle">Available</p>
                    <p className="mt-0.5 tabular font-medium">
                      {formatNumber(avail)}{" "}
                      <span className="font-normal text-fg-subtle">
                        ({formatPct((avail / (units || 1)) * 100)})
                      </span>
                    </p>
                  </div>
                </div>
                <ul className="mt-auto space-y-1">
                  {children.length === 0 ? (
                    <li className="px-2 py-1.5 text-xs text-fg-subtle">
                      No submarkets yet —{" "}
                      <Link to="/manage" className="text-accent hover:underline">
                        add one
                      </Link>
                    </li>
                  ) : (
                    children.map((s) => (
                      <li key={s.id}>
                        <Link
                          to="/market/$submarketId"
                          params={{ submarketId: s.id }}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{s.name}</span>
                            {s.live ? (
                              <Badge
                                variant="live"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                Live
                              </Badge>
                            ) : s.custom ? (
                              <Badge
                                variant="demo"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                New
                              </Badge>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Sparkline values={s.spark_ask ?? []} />
                            <TrendChip value={s.trend_7d_ask} />
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader
            title="Asking rent by submarket"
            description="Unweighted average asking rent across the competitive set."
          />
          <div className="panel p-4 sm:p-5">
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart
                  data={rentBars}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--color-fg-subtle)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === "asking" ? "Asking" : "Net-eff",
                    ]}
                    labelFormatter={(_, p) =>
                      (p?.[0]?.payload as { full?: string })?.full ?? ""
                    }
                  />
                  <Bar
                    dataKey="asking"
                    fill="var(--color-chart-1)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="net"
                    fill="var(--color-chart-2)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Availability rate"
            description="Units on market as a share of competitive-set inventory."
          />
          <div className="panel p-4 sm:p-5">
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart
                  data={availBars}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--color-fg-subtle)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatPct(v), "Availability"]}
                    labelFormatter={(_, p) =>
                      (p?.[0]?.payload as { full?: string })?.full ?? ""
                    }
                  />
                  <Bar
                    dataKey="avail"
                    fill="var(--color-chart-3)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      <section>
        <SectionHeader
          title="All submarkets"
          description="Sortable comparison — open any row for the full building set and survey."
          action={
            <Link
              to="/compare"
              className="text-sm font-medium text-accent hover:underline"
            >
              Full compare view
            </Link>
          }
        />
        <CompareTable submarkets={subs} />
      </section>
    </div>
  );
}

function TrendChip({ value }: { value: number | null }) {
  if (value == null || Math.abs(value) < 0.05) {
    return <span className="text-xs text-fg-subtle">—</span>;
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular font-medium",
        up ? "text-negative" : "text-positive",
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {formatPct(Math.abs(value), 1)}
    </span>
  );
}
