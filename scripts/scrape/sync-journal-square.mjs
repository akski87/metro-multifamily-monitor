#!/usr/bin/env node
/**
 * Pull the latest Journal Square dashboard feed (produced by the existing
 * journal-square-monitor daily scraper) and write it into this app's
 * SubmarketData shape: src/data/submarket-journal-square.json
 *
 * Source of truth for unit-level rents remains the building availability
 * pages; that scrape lives in akski87/journal-square-monitor. This script
 * only bridges the already-validated feed into the multi-market dashboard.
 *
 * Usage:
 *   node scripts/scrape/sync-journal-square.mjs
 *   node scripts/scrape/sync-journal-square.mjs --url <custom-url>
 *   node scripts/scrape/sync-journal-square.mjs --file /path/to/dashboard_data.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT = join(ROOT, "src/data/submarket-journal-square.json");
const STATUS = join(ROOT, "src/data/pipeline-status.json");

const DEFAULT_URL =
  "https://akski87.github.io/journal-square-monitor/dashboard_data.json";

const CENTER = [40.7315, -74.0625];

function parseArgs(argv) {
  const out = { url: DEFAULT_URL, file: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url") out.url = argv[++i];
    else if (argv[i] === "--file") out.file = argv[++i];
  }
  return out;
}

async function loadFeed(opts) {
  if (opts.file) {
    return JSON.parse(readFileSync(opts.file, "utf8"));
  }
  const res = await fetch(opts.url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "metro-multifamily-monitor/1.0 (data-sync)",
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} ${res.statusText} — ${opts.url}`);
  }
  return res.json();
}

function unitMixMap(unitMixList) {
  const map = new Map();
  for (const row of unitMixList || []) {
    // unit_mix rows are keyed by building display name in the JSQ feed
    map.set(row.building, {
      studio: row.studio ?? 0,
      br1: row.br1 ?? 0,
      br2: row.br2 ?? 0,
      br3: row.br3 ?? 0,
    });
  }
  return map;
}

function convert(feed) {
  const mixByName = unitMixMap(feed.unit_mix);
  const buildings = (feed.buildings || []).map((b) => ({
    id: b.id,
    name: b.name,
    units: b.units ?? 0,
    address: b.address ?? "",
    lat: b.lat ?? null,
    lng: b.lng ?? null,
    year_built: b.year_built ?? null,
    stories: b.stories ?? null,
    mgmt: b.mgmt ?? null,
    in_market: b.in_market !== false,
    method: b.method ?? null,
    source_url: b.source_url ?? null,
    portal_url: b.portal_url ?? null,
    available_now: b.available_now ?? null,
    concession_text: b.concession_text ?? null,
    concession_pct: b.concession_pct ?? null,
    conc_derived_pct: b.conc_derived_pct ?? null,
    as_of: b.as_of ?? feed.as_of,
    by_type: b.by_type ?? {},
    history: b.history ?? [],
    submarket_id: "journal-square",
    unit_mix: mixByName.get(b.name) ?? b.unit_mix ?? undefined,
  }));

  return {
    id: "journal-square",
    name: "Journal Square",
    market_id: "hudson-county",
    city: "Jersey City",
    state: "NJ",
    as_of: feed.as_of,
    generated_at: feed.generated_at ?? new Date().toISOString(),
    live: true,
    center: CENTER,
    buildings,
    market_history: feed.market_history ?? [],
    avg_unit_sf: feed.avg_unit_sf ?? [],
    data_quality: feed.data_quality ?? {
      checked_at: new Date().toISOString(),
      errors: [],
      warnings: [],
      quarantined_units: 0,
      policy: "Synced from Journal Square Market Monitor live feed.",
    },
    description:
      "Class A multifamily competitive set — live feed synced from Journal Square Market Monitor daily scrape.",
  };
}

function writeStatus(submarket, source) {
  let prev = {};
  try {
    prev = JSON.parse(readFileSync(STATUS, "utf8"));
  } catch {
    /* first run */
  }
  const live = {
    ...(prev.markets || {}),
    "journal-square": {
      id: "journal-square",
      name: "Journal Square",
      live: true,
      as_of: submarket.as_of,
      generated_at: submarket.generated_at,
      buildings: submarket.buildings.length,
      available: submarket.buildings.reduce(
        (a, b) => a + (b.available_now || 0),
        0,
      ),
      source,
      method: "upstream-sync",
      upstream:
        "https://akski87.github.io/journal-square-monitor/dashboard_data.json",
      scraper_repo: "https://github.com/akski87/journal-square-monitor",
      last_sync_at: new Date().toISOString(),
      warnings: submarket.data_quality?.warnings ?? [],
      errors: submarket.data_quality?.errors ?? [],
    },
  };
  const status = {
    updated_at: new Date().toISOString(),
    markets: live,
  };
  writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
  return status;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const source = opts.file ? `file:${opts.file}` : opts.url;
  console.log(`[sync-jsq] loading ${source}`);
  const feed = await loadFeed(opts);
  if (!feed?.buildings?.length) {
    throw new Error("Feed has no buildings — aborting");
  }
  const submarket = convert(feed);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(submarket) + "\n");
  const status = writeStatus(submarket, source);
  const avail = status.markets["journal-square"].available;
  console.log(
    `[sync-jsq] wrote ${OUT}\n` +
      `  as_of=${submarket.as_of}  buildings=${submarket.buildings.length}  available=${avail}`,
  );
}

main().catch((err) => {
  console.error("[sync-jsq] FATAL", err.message || err);
  process.exit(1);
});
