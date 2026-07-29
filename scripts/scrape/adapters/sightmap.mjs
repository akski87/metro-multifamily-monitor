/**
 * SightMap availability API adapter.
 * Many Greystar / Class A sites embed SightMap; units are on a JSON endpoint.
 *
 * api_endpoint example:
 *   https://sightmap.com/app/api/v1/yjp2098rwxl/sightmaps/88239
 */
export async function fetchSightmapUnits(apiEndpoint, { timeoutMs = 30000 } = {}) {
  if (!apiEndpoint) throw new Error("sightmap: missing api_endpoint");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(apiEndpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "metro-multifamily-monitor/1.0 (sightmap-adapter)",
      },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`sightmap HTTP ${res.status}`);
    const body = await res.json();
    const data = body?.data || body || {};
    const plans = new Map();
    for (const fp of data.floor_plans || []) {
      plans.set(fp.id, fp);
    }
    const units = (data.units || [])
      .map((u) => {
        const p = plans.get(u.floor_plan_id) || {};
        const unit = String(u.unit_number || u.display_unit_number || "")
          .replace(/^\s*(APT|UNIT|#)\s*/i, "")
          .trim();
        if (!unit) return null;
        const beds = p.bedroom_count ?? p.bedrooms ?? null;
        const baths = p.bathroom_count ?? p.bathrooms ?? null;
        const sqft = u.area ?? u.sqft ?? p.area ?? null;
        const price = u.price ?? u.price_min ?? null;
        return {
          unit,
          beds,
          baths,
          sqft: sqft != null ? Number(sqft) : null,
          asking: price != null ? Number(price) : null,
          net: null,
          avail: u.available_on || u.available_date || null,
          source: "sightmap_api",
        };
      })
      .filter(Boolean);
    return units;
  } finally {
    clearTimeout(t);
  }
}
