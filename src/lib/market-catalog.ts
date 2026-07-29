import type { MarketMeta, SubmarketData } from "./market-types";
import catalogJson from "@/data/markets-catalog.json";
import { buildIndex } from "./summarize";

/**
 * Baked-in submarkets: every file matching `submarket-*.json` is picked up
 * automatically. To ship a new market in the repo:
 *
 * 1. Add parent market to `src/data/markets-catalog.json` (if new parent)
 * 2. Drop `src/data/submarket-<id>.json` with full SubmarketData shape
 * 3. Done — no code changes, no re-registration
 */
const submarketModules = import.meta.glob("../data/submarket-*.json", {
  eager: true,
  import: "default",
}) as Record<string, SubmarketData>;

function loadBaseSubmarkets(): Record<string, SubmarketData> {
  const map: Record<string, SubmarketData> = {};
  for (const [path, data] of Object.entries(submarketModules)) {
    if (!data || typeof data !== "object") continue;
    const id = data.id || path.match(/submarket-(.+)\.json$/)?.[1];
    if (!id) continue;
    map[id] = { ...data, id, custom: false };
  }
  return map;
}

export const BASE_MARKETS: MarketMeta[] = (
  catalogJson as { markets: MarketMeta[]; as_of: string }
).markets.map((m) => ({ ...m, custom: false }));

export const BASE_AS_OF = (catalogJson as { as_of: string }).as_of;

export const BASE_SUBMARKETS = loadBaseSubmarkets();

export const BASE_INDEX = buildIndex(
  BASE_MARKETS,
  Object.values(BASE_SUBMARKETS),
  BASE_AS_OF,
);

export function isValidSubmarketPayload(v: unknown): v is SubmarketData {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.market_id === "string" &&
    Array.isArray(o.buildings)
  );
}

export function isValidMarketMeta(v: unknown): v is MarketMeta {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.state === "string"
  );
}
