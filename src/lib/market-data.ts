import type {
  Building,
  TypeMetrics,
  UnitType,
} from "./market-types";
import { UNIT_TYPES } from "./market-types";
import { BASE_INDEX, BASE_SUBMARKETS } from "./market-catalog";

/** Static base index (no custom/local additions). Prefer useMarketsIndex() in UI. */
export const index = BASE_INDEX;

export function getSubmarket(id: string) {
  return BASE_SUBMARKETS[id] ?? null;
}

export function getAllSubmarkets() {
  return Object.values(BASE_SUBMARKETS);
}

export function getMarketForSubmarket(submarketId: string) {
  const sm = BASE_INDEX.submarkets.find((s) => s.id === submarketId);
  if (!sm) return null;
  return BASE_INDEX.markets.find((m) => m.id === sm.market_id) ?? null;
}

export type LiveSurveyRow = {
  type: UnitType | "All";
  count: number;
  askingMin: number | null;
  askingAvg: number | null;
  askingMax: number | null;
  sqftAvg: number | null;
  askingPsf: number | null;
  netAvg: number | null;
  netPsf: number | null;
};

export type MarketAggregates = {
  buildingsIn: Building[];
  totalUnits: number;
  available: number;
  availPct: number;
  concessionAvg: number | null;
  survey: LiveSurveyRow[];
  byTypeBars: Array<{
    type: string;
    asking: number | null;
    net: number | null;
    askingPsf: number | null;
    netPsf: number | null;
    count: number;
  }>;
  unitMix: { studio: number; br1: number; br2: number; br3: number; total: number };
  askingAvg: number | null;
  netAvg: number | null;
  psfAvg: number | null;
};

function weightedAvg(
  items: Array<{ value: number | null | undefined; weight: number }>,
): number | null {
  let sum = 0;
  let w = 0;
  for (const it of items) {
    if (it.value == null || !it.weight) continue;
    sum += it.value * it.weight;
    w += it.weight;
  }
  return w > 0 ? sum / w : null;
}

export function aggregateBuildings(
  buildings: Building[],
  inMarketIds: Set<string>,
): MarketAggregates {
  const buildingsIn = buildings.filter((b) => inMarketIds.has(b.id));
  const totalUnits = buildingsIn.reduce((a, b) => a + (b.units || 0), 0);
  const available = buildingsIn.reduce(
    (a, b) => a + (b.available_now || 0),
    0,
  );
  const availPct = totalUnits > 0 ? (available / totalUnits) * 100 : 0;

  const concs = buildingsIn
    .map((b) => b.concession_pct ?? b.conc_derived_pct)
    .filter((v): v is number => v != null);
  const concessionAvg =
    concs.length > 0
      ? (concs.reduce((a, b) => a + b, 0) / concs.length) * 100
      : null;

  const mix = { studio: 0, br1: 0, br2: 0, br3: 0, total: 0 };
  for (const b of buildingsIn) {
    if (!b.unit_mix) continue;
    mix.studio += b.unit_mix.studio || 0;
    mix.br1 += b.unit_mix.br1 || 0;
    mix.br2 += b.unit_mix.br2 || 0;
    mix.br3 += b.unit_mix.br3 || 0;
  }
  mix.total = mix.studio + mix.br1 + mix.br2 + mix.br3;

  const typeBuckets: Record<
    string,
    {
      count: number;
      asks: Array<{ value: number; weight: number }>;
      nets: Array<{ value: number; weight: number }>;
      sfs: Array<{ value: number; weight: number }>;
      askPsf: Array<{ value: number; weight: number }>;
      netPsf: Array<{ value: number; weight: number }>;
      minAsk: number | null;
      maxAsk: number | null;
    }
  > = {};

  for (const t of UNIT_TYPES) {
    typeBuckets[t] = {
      count: 0,
      asks: [],
      nets: [],
      sfs: [],
      askPsf: [],
      netPsf: [],
      minAsk: null,
      maxAsk: null,
    };
  }

  for (const b of buildingsIn) {
    for (const [t, m] of Object.entries(b.by_type || {}) as Array<
      [string, TypeMetrics]
    >) {
      if (!typeBuckets[t]) {
        typeBuckets[t] = {
          count: 0,
          asks: [],
          nets: [],
          sfs: [],
          askPsf: [],
          netPsf: [],
          minAsk: null,
          maxAsk: null,
        };
      }
      const bucket = typeBuckets[t];
      const c = m.count || 0;
      bucket.count += c;
      if (m.asking_avg != null) bucket.asks.push({ value: m.asking_avg, weight: c || 1 });
      if (m.net_avg != null) bucket.nets.push({ value: m.net_avg, weight: c || 1 });
      if (m.sqft_avg != null) bucket.sfs.push({ value: m.sqft_avg, weight: c || 1 });
      if (m.asking_psf != null)
        bucket.askPsf.push({ value: m.asking_psf, weight: m.psf_n || c || 1 });
      if (m.net_psf != null)
        bucket.netPsf.push({ value: m.net_psf, weight: m.psf_n || c || 1 });
      if (m.asking_min != null)
        bucket.minAsk =
          bucket.minAsk == null
            ? m.asking_min
            : Math.min(bucket.minAsk, m.asking_min);
      if (m.asking_max != null)
        bucket.maxAsk =
          bucket.maxAsk == null
            ? m.asking_max
            : Math.max(bucket.maxAsk, m.asking_max);
    }
  }

  const survey: LiveSurveyRow[] = [];
  let allCount = 0;
  const allAsks: Array<{ value: number; weight: number }> = [];
  const allNets: Array<{ value: number; weight: number }> = [];
  const allSfs: Array<{ value: number; weight: number }> = [];
  const allPsf: Array<{ value: number; weight: number }> = [];
  const allNetPsf: Array<{ value: number; weight: number }> = [];
  let allMin: number | null = null;
  let allMax: number | null = null;

  const byTypeBars: MarketAggregates["byTypeBars"] = [];

  for (const t of UNIT_TYPES) {
    const b = typeBuckets[t];
    if (!b) continue;
    const askingAvg = weightedAvg(b.asks);
    const netAvg = weightedAvg(b.nets);
    const sqftAvg = weightedAvg(b.sfs);
    const askingPsf = weightedAvg(b.askPsf);
    const netPsf = weightedAvg(b.netPsf);
    survey.push({
      type: t,
      count: b.count,
      askingMin: b.minAsk,
      askingAvg,
      askingMax: b.maxAsk,
      sqftAvg,
      askingPsf,
      netAvg,
      netPsf,
    });
    byTypeBars.push({
      type: t,
      asking: askingAvg,
      net: netAvg,
      askingPsf,
      netPsf,
      count: b.count,
    });
    allCount += b.count;
    allAsks.push(...b.asks);
    allNets.push(...b.nets);
    allSfs.push(...b.sfs);
    allPsf.push(...b.askPsf);
    allNetPsf.push(...b.netPsf);
    if (b.minAsk != null)
      allMin = allMin == null ? b.minAsk : Math.min(allMin, b.minAsk);
    if (b.maxAsk != null)
      allMax = allMax == null ? b.maxAsk : Math.max(allMax, b.maxAsk);
  }

  survey.unshift({
    type: "All",
    count: allCount,
    askingMin: allMin,
    askingAvg: weightedAvg(allAsks),
    askingMax: allMax,
    sqftAvg: weightedAvg(allSfs),
    askingPsf: weightedAvg(allPsf),
    netAvg: weightedAvg(allNets),
    netPsf: weightedAvg(allNetPsf),
  });

  return {
    buildingsIn,
    totalUnits,
    available,
    availPct,
    concessionAvg,
    survey,
    byTypeBars,
    unitMix: mix,
    askingAvg: weightedAvg(allAsks),
    netAvg: weightedAvg(allNets),
    psfAvg: weightedAvg(allPsf),
  };
}

export function buildingAskingPsf(b: Building): number | null {
  const vals: Array<{ value: number; weight: number }> = [];
  for (const m of Object.values(b.by_type || {})) {
    if (m?.asking_psf != null)
      vals.push({ value: m.asking_psf, weight: m.psf_n || m.count || 1 });
  }
  return weightedAvg(vals);
}

export function buildingNetPsf(b: Building): number | null {
  const vals: Array<{ value: number; weight: number }> = [];
  for (const m of Object.values(b.by_type || {})) {
    if (m?.net_psf != null)
      vals.push({ value: m.net_psf, weight: m.psf_n || m.count || 1 });
  }
  return weightedAvg(vals);
}

export function buildingAskingAvg(b: Building): number | null {
  const vals: Array<{ value: number; weight: number }> = [];
  for (const m of Object.values(b.by_type || {})) {
    if (m?.asking_avg != null)
      vals.push({ value: m.asking_avg, weight: m.count || 1 });
  }
  return weightedAvg(vals);
}

export function buildingNetAvg(b: Building): number | null {
  const vals: Array<{ value: number; weight: number }> = [];
  for (const m of Object.values(b.by_type || {})) {
    if (m?.net_avg != null)
      vals.push({ value: m.net_avg, weight: m.count || 1 });
  }
  return weightedAvg(vals);
}
