/**
 * Roll raw unit listings into the dashboard's by_type / building summary shape.
 */

const TYPE_OF = (beds) => {
  if (beds == null || Number.isNaN(Number(beds))) return null;
  const b = Number(beds);
  if (b <= 0) return "Studio";
  if (b === 1) return "1BR";
  if (b === 2) return "2BR";
  return "3BR";
};

function avg(nums) {
  const xs = nums.filter((n) => n != null && !Number.isNaN(n));
  if (!xs.length) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}

function min(nums) {
  const xs = nums.filter((n) => n != null && !Number.isNaN(n));
  return xs.length ? Math.min(...xs) : null;
}

function max(nums) {
  const xs = nums.filter((n) => n != null && !Number.isNaN(n));
  return xs.length ? Math.max(...xs) : null;
}

/** @param {Array<{beds,sqft,asking,net}>} units */
export function rollupByType(units) {
  const buckets = new Map();
  for (const u of units) {
    const t = TYPE_OF(u.beds);
    if (!t) continue;
    if (!buckets.has(t)) buckets.set(t, []);
    buckets.get(t).push(u);
  }
  /** @type {Record<string, object>} */
  const by_type = {};
  for (const [t, rows] of buckets) {
    const asks = rows.map((r) => r.asking);
    const nets = rows.map((r) => r.net);
    const sqfts = rows.map((r) => r.sqft);
    const askAvg = avg(asks);
    const netAvg = avg(nets);
    const sqftAvg = avg(sqfts);
    const psfRows = rows.filter((r) => r.asking && r.sqft);
    const askPsf = avg(psfRows.map((r) => r.asking / r.sqft));
    const netPsfRows = rows.filter((r) => r.net && r.sqft);
    const netPsf = avg(netPsfRows.map((r) => r.net / r.sqft));
    by_type[t] = {
      count: rows.length,
      asking_avg: askAvg,
      net_avg: netAvg,
      sqft_avg: sqftAvg,
      asking_min: min(asks),
      asking_max: max(asks),
      net_min: min(nets),
      net_max: max(nets),
      asking_psf: askPsf != null ? Math.round(askPsf * 100) / 100 : null,
      net_psf: netPsf != null ? Math.round(netPsf * 100) / 100 : null,
      psf_n: psfRows.length,
    };
  }
  return by_type;
}

export function buildingFromUnits(meta, units, asOf) {
  const by_type = rollupByType(units);
  const asks = units.map((u) => u.asking).filter((n) => n != null);
  const nets = units.map((u) => u.net).filter((n) => n != null);
  return {
    id: meta.id,
    name: meta.name,
    units: meta.units ?? 0,
    address: meta.address ?? "",
    lat: meta.lat ?? null,
    lng: meta.lng ?? null,
    year_built: meta.year_built ?? null,
    stories: meta.stories ?? null,
    mgmt: meta.mgmt ?? null,
    in_market: meta.in_market !== false,
    method: meta.method ?? null,
    source_url: meta.url ?? meta.source_url ?? null,
    portal_url: meta.portal_url ?? null,
    available_now: units.length,
    concession_text: meta.concession_text ?? null,
    concession_pct: meta.concession_pct ?? null,
    conc_derived_pct: null,
    as_of: asOf,
    by_type,
    history: [],
    unit_mix: meta.unit_mix,
    _unit_rows: units,
    _ask_avg: avg(asks),
    _net_avg: avg(nets),
  };
}
