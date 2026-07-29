#!/usr/bin/env node
/**
 * Multi-market rent scrape orchestrator.
 *
 * Commands:
 *   node scripts/scrape/run.mjs status
 *   node scripts/scrape/run.mjs sync              # Journal Square upstream only
 *   node scripts/scrape/run.mjs scrape [--id id]  # scrape enabled registry buildings
 *   node scripts/scrape/run.mjs all               # sync + scrape
 *
 * Journal Square is never re-scraped here — it syncs from journal-square-monitor.
 * Other submarkets use adapters registered in registry.json.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSightmapUnits } from "./adapters/sightmap.mjs";
import { buildingFromUnits } from "./adapters/aggregate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const REGISTRY = join(__dirname, "registry.json");
const STATUS = join(ROOT, "src/data/pipeline-status.json");
const DATA = join(ROOT, "src/data");

function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY, "utf8"));
}

function loadStatus() {
  try {
    return JSON.parse(readFileSync(STATUS, "utf8"));
  } catch {
    return { updated_at: null, markets: {} };
  }
}

function saveStatus(status) {
  mkdirSync(dirname(STATUS), { recursive: true });
  status.updated_at = new Date().toISOString();
  writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
}

function asOfEt(d = new Date()) {
  // America/New_York calendar date
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function cmdSync() {
  const r = spawnSync(
    process.execPath,
    [join(__dirname, "sync-journal-square.mjs")],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function scrapeBuilding(b) {
  if (b.enabled === false) {
    return { skipped: true, reason: "disabled" };
  }
  if (b.method === "sightmap_api") {
    const units = await fetchSightmapUnits(b.api_endpoint);
    return { units, method: "sightmap_api" };
  }
  throw new Error(`No adapter for method=${b.method} (building ${b.id})`);
}

async function scrapeSubmarket(sm) {
  if (sm.mode === "upstream_sync") {
    console.log(`[scrape] ${sm.id}: upstream_sync — use sync command`);
    return null;
  }
  const asOf = asOfEt();
  const buildings = [];
  const errors = [];
  const warnings = [];

  for (const b of sm.buildings || []) {
    if (b.enabled === false) {
      console.log(`  skip ${b.id} (disabled template)`);
      continue;
    }
    try {
      console.log(`  scrape ${b.name} (${b.method})…`);
      const result = await scrapeBuilding(b);
      if (result.skipped) {
        console.log(`    skipped: ${result.reason}`);
        continue;
      }
      const rolled = buildingFromUnits(b, result.units, asOf);
      delete rolled._unit_rows;
      delete rolled._ask_avg;
      delete rolled._net_avg;
      buildings.push(rolled);
      console.log(`    ${result.units.length} units`);
    } catch (err) {
      const msg = `${b.name}: ${err.message || err}`;
      errors.push(msg);
      console.error(`    ERROR ${msg}`);
    }
  }

  if (!buildings.length) {
    warnings.push("No buildings scraped successfully");
    return { sm, buildings, asOf, errors, warnings, empty: true };
  }

  // market-level history point for today
  const allAsk = [];
  const allNet = [];
  let totalAvail = 0;
  const byTypeAgg = {};
  for (const b of buildings) {
    totalAvail += b.available_now || 0;
    for (const [t, m] of Object.entries(b.by_type || {})) {
      if (!byTypeAgg[t]) byTypeAgg[t] = { asks: [], nets: [] };
      if (m.asking_avg != null) {
        for (let i = 0; i < m.count; i++) byTypeAgg[t].asks.push(m.asking_avg);
      }
      if (m.net_avg != null) {
        for (let i = 0; i < m.count; i++) byTypeAgg[t].nets.push(m.net_avg);
      }
    }
  }
  const by_type = {};
  for (const [t, bag] of Object.entries(byTypeAgg)) {
    const ask =
      bag.asks.length > 0
        ? Math.round(bag.asks.reduce((a, b) => a + b, 0) / bag.asks.length)
        : null;
    const net =
      bag.nets.length > 0
        ? Math.round(bag.nets.reduce((a, b) => a + b, 0) / bag.nets.length)
        : null;
    by_type[t] = { asking: ask, net };
    if (ask != null) allAsk.push(...bag.asks);
    if (net != null) allNet.push(...bag.nets);
  }
  const all_asking =
    allAsk.length > 0
      ? Math.round(allAsk.reduce((a, b) => a + b, 0) / allAsk.length)
      : null;
  const all_net =
    allNet.length > 0
      ? Math.round(allNet.reduce((a, b) => a + b, 0) / allNet.length)
      : null;

  // Merge with existing history if file exists
  const outPath = join(DATA, `submarket-${sm.id}.json`);
  let prev = null;
  try {
    prev = JSON.parse(readFileSync(outPath, "utf8"));
  } catch {
    /* new */
  }
  const history = [...(prev?.market_history || [])];
  // replace same-day point
  const withoutToday = history.filter((h) => h.date !== asOf);
  withoutToday.push({
    date: asOf,
    total_available: totalAvail,
    by_type,
    note: "Automated scrape",
    all_asking: all_asking ?? 0,
    all_net: all_net ?? 0,
  });
  withoutToday.sort((a, b) => a.date.localeCompare(b.date));

  // preserve building history series
  const prevById = new Map((prev?.buildings || []).map((b) => [b.id, b]));
  for (const b of buildings) {
    const ph = prevById.get(b.id)?.history || [];
    const series = ph.filter((h) => h.date !== asOf);
    const ne =
      Object.values(b.by_type || {}).find((m) => m.net_avg)?.net_avg ??
      Object.values(b.by_type || {}).find((m) => m.asking_avg)?.asking_avg ??
      null;
    series.push({ date: asOf, n: b.available_now, ne });
    series.sort((a, c) => a.date.localeCompare(c.date));
    b.history = series;
    b.submarket_id = sm.id;
  }

  const payload = {
    id: sm.id,
    name: sm.name,
    market_id: sm.market_id,
    city: sm.city,
    state: sm.state,
    as_of: asOf,
    generated_at: new Date().toISOString(),
    live: true,
    center: sm.center || [0, 0],
    buildings,
    market_history: withoutToday,
    avg_unit_sf: prev?.avg_unit_sf || [],
    data_quality: {
      checked_at: new Date().toISOString(),
      errors,
      warnings,
      quarantined_units: 0,
      policy:
        "Automated multi-market scrape. Real listings only; empty sides left blank.",
    },
    description: `${sm.name} Class A comps — automated availability scrape.`,
  };

  writeFileSync(outPath, JSON.stringify(payload) + "\n");
  console.log(`[scrape] wrote ${outPath}`);

  const status = loadStatus();
  status.markets[sm.id] = {
    id: sm.id,
    name: sm.name,
    live: true,
    as_of: asOf,
    generated_at: payload.generated_at,
    buildings: buildings.length,
    available: totalAvail,
    method: "scrape",
    last_sync_at: new Date().toISOString(),
    warnings,
    errors,
  };
  saveStatus(status);
  return payload;
}

async function cmdScrape(filterId) {
  const reg = loadRegistry();
  for (const sm of reg.submarkets) {
    if (sm.mode !== "scrape") continue;
    if (filterId && sm.id !== filterId) continue;
    console.log(`[scrape] submarket ${sm.id}`);
    await scrapeSubmarket(sm);
  }
}

function cmdStatus() {
  const reg = loadRegistry();
  const status = loadStatus();
  console.log("Pipeline status\n");
  for (const sm of reg.submarkets) {
    const st = status.markets?.[sm.id];
    console.log(
      `  ${sm.id.padEnd(18)} mode=${sm.mode.padEnd(14)} ` +
        (st
          ? `as_of=${st.as_of} buildings=${st.buildings} avail=${st.available} live=${st.live}`
          : "no run yet"),
    );
    if (sm.mode === "upstream_sync") {
      console.log(`    upstream: ${sm.upstream?.url}`);
    }
  }
  console.log(`\nstatus file: ${STATUS}`);
  console.log(`updated_at: ${status.updated_at || "—"}`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(`Usage:
  node scripts/scrape/run.mjs status
  node scripts/scrape/run.mjs sync
  node scripts/scrape/run.mjs scrape [--id <submarket>]
  node scripts/scrape/run.mjs all`);
    process.exit(0);
  }
  if (cmd === "status") return cmdStatus();
  if (cmd === "sync") return cmdSync();
  if (cmd === "scrape") {
    let id = null;
    const i = rest.indexOf("--id");
    if (i >= 0) id = rest[i + 1];
    return cmdScrape(id);
  }
  if (cmd === "all") {
    cmdSync();
    await cmdScrape(null);
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("[scrape] FATAL", err);
  process.exit(1);
});
