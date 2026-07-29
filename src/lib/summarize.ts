import type {
  MarketMeta,
  MarketsIndex,
  SubmarketData,
  SubmarketSummary,
} from "./market-types";

/** Build portfolio index from parent markets + full submarket payloads. */
export function buildIndex(
  markets: MarketMeta[],
  submarkets: SubmarketData[],
  asOf?: string,
): MarketsIndex {
  const byMarket = new Map<string, string[]>();
  for (const m of markets) byMarket.set(m.id, []);

  const summaries: SubmarketSummary[] = submarkets.map((sm) => {
    const list = byMarket.get(sm.market_id) ?? [];
    list.push(sm.id);
    byMarket.set(sm.market_id, list);

    const marketName =
      markets.find((m) => m.id === sm.market_id)?.name ?? sm.market_id;
    const totalUnits = sm.buildings.reduce((a, b) => a + (b.units || 0), 0);
    const available = sm.buildings.reduce(
      (a, b) => a + (b.available_now || 0),
      0,
    );
    const last = sm.market_history[sm.market_history.length - 1];
    const concs = sm.buildings
      .map((b) => b.concession_pct ?? b.conc_derived_pct)
      .filter((v): v is number => v != null);
    const avgConc =
      concs.length > 0
        ? (concs.reduce((a, b) => a + b, 0) / concs.length) * 100
        : 0;

    const psfs: number[] = [];
    for (const b of sm.buildings) {
      for (const m of Object.values(b.by_type || {})) {
        if (m?.asking_psf != null && m.count) {
          for (let i = 0; i < m.count; i++) psfs.push(m.asking_psf);
        }
      }
    }
    const psfAvg =
      psfs.length > 0 ? psfs.reduce((a, b) => a + b, 0) / psfs.length : null;

    let trend: number | null = null;
    if (sm.market_history.length >= 8) {
      const a0 = sm.market_history[sm.market_history.length - 8]?.all_asking;
      const a1 = last?.all_asking;
      if (a0 && a1) trend = ((a1 - a0) / a0) * 100;
    }

    return {
      id: sm.id,
      name: sm.name,
      market_id: sm.market_id,
      market_name: marketName,
      city: sm.city,
      state: sm.state,
      live: sm.live,
      building_count: sm.buildings.length,
      total_units: totalUnits,
      available,
      avail_pct: totalUnits ? (available / totalUnits) * 100 : 0,
      asking_avg: last?.all_asking ?? null,
      net_avg: last?.all_net ?? null,
      concession_avg: Math.round(avgConc * 10) / 10,
      psf_avg: psfAvg != null ? Math.round(psfAvg * 10) / 10 : null,
      center: sm.center,
      by_type: last?.by_type,
      trend_7d_ask: trend != null ? Math.round(trend * 100) / 100 : null,
      custom: sm.custom,
    };
  });

  const marketRows = markets.map((m) => ({
    ...m,
    submarket_ids: byMarket.get(m.id) ?? [],
  }));

  // orphan parent markets with no meta still show if submarkets reference them
  for (const [mid, ids] of byMarket) {
    if (!marketRows.some((m) => m.id === mid)) {
      marketRows.push({
        id: mid,
        name: mid,
        region: "",
        state: summaries.find((s) => s.market_id === mid)?.state ?? "",
        submarket_ids: ids,
        custom: true,
      });
    }
  }

  const latestAsOf =
    asOf ??
    submarkets.map((s) => s.as_of).sort().at(-1) ??
    new Date().toISOString().slice(0, 10);

  return {
    as_of: latestAsOf,
    markets: marketRows,
    submarkets: summaries,
  };
}
