import type {
  Building,
  MarketHistoryPoint,
  SubmarketData,
  TypeMetrics,
} from "./market-types";
import { slugify } from "./slug";

export type GenerateSubmarketInput = {
  name: string;
  marketId: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  buildingCount: number;
  /** Studio asking anchor */
  studioRent: number;
  /** 1BR asking anchor */
  oneBrRent: number;
  /** 2BR asking anchor */
  twoBrRent: number;
  /** 3BR asking anchor */
  threeBrRent: number;
  /** Typical concession as fraction of annual rent (e.g. 0.08 = ~1 mo) */
  concessionRate: number;
  /** Target availability rate 0–1 */
  availabilityRate: number;
  description?: string;
  id?: string;
};

const ROOTS = [
  "Apex",
  "Harbor",
  "Summit",
  "Atlas",
  "Meridian",
  "Foundry",
  "Lumen",
  "Vesper",
  "Cobalt",
  "Sierra",
  "Arc",
  "Quay",
  "Pinnacle",
  "Nova",
  "Forge",
  "Indigo",
  "Ridge",
  "Canal",
  "Ferry",
  "Exchange",
  "Commons",
  "Yard",
  "Pier",
  "Grove",
  "Court",
];
const SUFFIXES = [
  "House",
  "Tower",
  "Residences",
  "Lofts",
  "Place",
  "Square",
  "Living",
  "Point",
  "Collection",
  "Hall",
];
const STREETS = [
  "Main",
  "Water",
  "First",
  "Hudson",
  "Washington",
  "Grove",
  "Front",
  "Bridge",
  "Park",
  "River",
  "Summit",
  "Court",
  "Grand",
  "Adams",
];
const MGMT = [
  "Related",
  "Equity Residential",
  "AvalonBay",
  "Greystar",
  "Brookfield",
  "TF Cornerstone",
  "Local",
];

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(rand: () => number, v: number, pct = 0.08) {
  return Math.round(v * (1 + (rand() * 2 - 1) * pct));
}

/**
 * Generate a demo submarket with buildings, unit mix, and 49-day history.
 * Deterministic for a given name+market so re-runs are stable.
 */
export function generateSubmarket(input: GenerateSubmarketInput): SubmarketData {
  const id = input.id || slugify(input.name);
  const rand = mulberry32(hashSeed(`${input.marketId}:${id}`));
  const asOf = new Date().toISOString().slice(0, 10);
  const n = Math.max(1, Math.min(20, Math.round(input.buildingCount)));

  const used = new Set<string>();
  const buildings: Building[] = [];

  for (let i = 0; i < n; i++) {
    let name = "";
    for (let t = 0; t < 40; t++) {
      const root = ROOTS[Math.floor(rand() * ROOTS.length)]!;
      const suf = SUFFIXES[Math.floor(rand() * SUFFIXES.length)]!;
      const prefix = rand() > 0.45 ? "The " : "";
      name = `${prefix}${root} ${suf}`.trim();
      if (!used.has(name)) break;
    }
    used.add(name);

    const units = Math.round(
      [90, 120, 180, 240, 320, 420, 520, 680, 900, 1200][
        Math.floor(rand() * 10)
      ]! *
        (0.85 + rand() * 0.3),
    );
    const availRate = input.availabilityRate * (0.4 + rand() * 1.4);
    const available = Math.max(0, Math.round(units * availRate));
    const lat = input.lat + (rand() - 0.5) * 0.016;
    const lng = input.lng + (rand() - 0.5) * 0.02;
    const street = STREETS[Math.floor(rand() * STREETS.length)]!;
    const address = `${Math.floor(10 + rand() * 880)} ${street} St, ${input.city}`;

    const conc =
      rand() > 0.25
        ? input.concessionRate * (0.5 + rand() * 1.1)
        : null;
    const concText = conc
      ? `Up to ${Math.max(1, Math.round(conc * 12))} months free`
      : rand() > 0.6
        ? "Incentives offered — contact leasing"
        : null;

    const studioPct = 0.15 + rand() * 0.25;
    const br1Pct = 0.35 + rand() * 0.2;
    const br2Pct = 0.12 + rand() * 0.16;
    let br3Pct = 1 - studioPct - br1Pct - br2Pct;
    if (br3Pct < 0.01) br3Pct = 0.01;
    const sum = studioPct + br1Pct + br2Pct + br3Pct;
    const unit_mix = {
      studio: Math.round((units * studioPct) / sum),
      br1: Math.round((units * br1Pct) / sum),
      br2: Math.round((units * br2Pct) / sum),
      br3: 0,
    };
    unit_mix.br3 = Math.max(
      0,
      units - unit_mix.studio - unit_mix.br1 - unit_mix.br2,
    );

    const baseRents = {
      Studio: input.studioRent,
      "1BR": input.oneBrRent,
      "2BR": input.twoBrRent,
      "3BR": input.threeBrRent,
    };
    const baseSf = { Studio: 470, "1BR": 700, "2BR": 1020, "3BR": 1250 };
    const types = ["Studio", "1BR", "2BR", "3BR"] as const;
    let rem = available;
    const by_type: Record<string, TypeMetrics> = {};
    for (let ti = 0; ti < types.length; ti++) {
      const t = types[ti]!;
      const c =
        ti === types.length - 1
          ? rem
          : Math.min(rem, Math.floor(available * (0.15 + rand() * 0.25)));
      rem -= c;
      if (c <= 0) continue;
      const ask = jitter(rand, baseRents[t], 0.12);
      const net = conc ? Math.round(ask * (1 - conc)) : ask;
      const sf = jitter(rand, baseSf[t], 0.1);
      by_type[t] = {
        count: c,
        asking_avg: ask,
        net_avg: net,
        sqft_avg: sf,
        asking_min: Math.round(ask * 0.92),
        asking_max: Math.round(ask * 1.12),
        net_min: Math.round(net * 0.92),
        net_max: Math.round(net * 1.08),
        asking_psf: Math.round((ask * 12) / sf * 100) / 100,
        net_psf: Math.round((net * 12) / sf * 100) / 100,
        psf_n: c,
      };
    }

    const asks = Object.values(by_type).map((v) => v.asking_avg);
    let ne =
      asks.length > 0
        ? Math.round(asks.reduce((a, b) => a + b, 0) / asks.length)
        : null;
    let nAvail = available;
    const history: Building["history"] = [];
    const start = new Date("2026-06-08T12:00:00Z");
    for (let d = 0; d < 49; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + d);
      nAvail = Math.max(0, nAvail + Math.floor(rand() * 5) - 2);
      if (ne != null) ne = Math.round(ne * (1 + (rand() - 0.45) * 0.008));
      history.push({
        date: date.toISOString().slice(0, 10),
        n: nAvail,
        ne,
      });
    }

    buildings.push({
      id: `${id}_${i}_${slugify(name)}`,
      name,
      units,
      address,
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      year_built: 2015 + Math.floor(rand() * 11),
      stories: [8, 12, 18, 24, 30, 36, 42][Math.floor(rand() * 7)]!,
      mgmt: MGMT[Math.floor(rand() * MGMT.length)]!,
      in_market: true,
      method: "generated",
      available_now: available,
      concession_text: concText,
      concession_pct: conc != null ? Math.round(conc * 10000) / 10000 : null,
      conc_derived_pct: conc != null ? Math.round(conc * 10000) / 10000 : null,
      as_of: asOf,
      by_type,
      history,
      unit_mix,
      submarket_id: id,
    });
  }

  const totalUnits = buildings.reduce((a, b) => a + b.units, 0);
  let baseAvail = Math.round(totalUnits * input.availabilityRate);
  let baseAsk =
    input.studioRent * 0.25 +
    input.oneBrRent * 0.45 +
    input.twoBrRent * 0.25 +
    input.threeBrRent * 0.05;
  let baseNet = baseAsk * (1 - input.concessionRate);

  const market_history: MarketHistoryPoint[] = [];
  const start = new Date("2026-06-08T12:00:00Z");
  for (let d = 0; d < 49; d++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + d);
    baseAsk *= 1 + (rand() - 0.4) * 0.006;
    baseNet = baseAsk * (1 - input.concessionRate * (0.85 + rand() * 0.3));
    baseAvail = Math.max(8, Math.round(baseAvail * (1 + (rand() - 0.5) * 0.06)));
    market_history.push({
      date: date.toISOString().slice(0, 10),
      total_available: baseAvail,
      all_asking: Math.round(baseAsk),
      all_net: Math.round(baseNet),
      note: "Generated demo series.",
      by_type: {
        Studio: {
          asking: Math.round(baseAsk * 0.81),
          net: Math.round(baseNet * 0.81),
        },
        "1BR": {
          asking: Math.round(baseAsk * 0.98),
          net: Math.round(baseNet * 0.98),
        },
        "2BR": {
          asking: Math.round(baseAsk * 1.4),
          net: Math.round(baseNet * 1.4),
        },
        "3BR": {
          asking: Math.round(baseAsk * 1.76),
          net: Math.round(baseNet * 1.76),
        },
      },
    });
  }

  const mixTotals = buildings.reduce(
    (a, b) => {
      if (!b.unit_mix) return a;
      a.studio += b.unit_mix.studio;
      a.br1 += b.unit_mix.br1;
      a.br2 += b.unit_mix.br2;
      a.br3 += b.unit_mix.br3;
      return a;
    },
    { studio: 0, br1: 0, br2: 0, br3: 0 },
  );

  return {
    id,
    name: input.name.trim(),
    market_id: input.marketId,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase().slice(0, 2),
    as_of: asOf,
    generated_at: new Date().toISOString(),
    live: false,
    center: [input.lat, input.lng],
    buildings,
    market_history,
    avg_unit_sf: [
      {
        t: "Studio",
        n: mixTotals.studio,
        avg_sqft: 470,
        min_sqft: 380,
        max_sqft: 620,
      },
      {
        t: "1BR",
        n: mixTotals.br1,
        avg_sqft: 700,
        min_sqft: 520,
        max_sqft: 950,
      },
      {
        t: "2BR",
        n: mixTotals.br2,
        avg_sqft: 1020,
        min_sqft: 800,
        max_sqft: 1300,
      },
      {
        t: "3BR",
        n: mixTotals.br3,
        avg_sqft: 1250,
        min_sqft: 1000,
        max_sqft: 1600,
      },
    ],
    data_quality: {
      checked_at: new Date().toISOString(),
      errors: [],
      warnings: [],
      quarantined_units: 0,
      policy:
        "Generated demo submarket for multi-market expansion. Replace with live survey JSON when ready.",
    },
    description:
      input.description?.trim() ||
      `Class A multifamily comps in ${input.name.trim()}, ${input.city.trim()} — generated for multi-market expansion.`,
    custom: true,
  };
}

/** Minimal empty submarket shell (no generated comps). */
export function emptySubmarket(input: {
  id?: string;
  name: string;
  marketId: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  description?: string;
}): SubmarketData {
  const id = input.id || slugify(input.name);
  const asOf = new Date().toISOString().slice(0, 10);
  return {
    id,
    name: input.name.trim(),
    market_id: input.marketId,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase().slice(0, 2),
    as_of: asOf,
    generated_at: new Date().toISOString(),
    live: false,
    center: [input.lat, input.lng],
    buildings: [],
    market_history: [],
    avg_unit_sf: [],
    data_quality: {
      checked_at: new Date().toISOString(),
      errors: [],
      warnings: ["No buildings yet — import survey JSON or generate demo comps."],
      quarantined_units: 0,
      policy: "Empty submarket shell.",
    },
    description:
      input.description?.trim() ||
      `Submarket shell for ${input.name.trim()}. Add buildings via import or generator.`,
    custom: true,
  };
}
