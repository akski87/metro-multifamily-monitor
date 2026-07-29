import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MarketMeta,
  MarketsIndex,
  SubmarketData,
} from "./market-types";
import {
  BASE_AS_OF,
  BASE_MARKETS,
  BASE_SUBMARKETS,
  isValidMarketMeta,
  isValidSubmarketPayload,
} from "./market-catalog";
import { buildIndex } from "./summarize";
import { uniqueSlug } from "./slug";

export type CustomPack = {
  markets: MarketMeta[];
  submarkets: SubmarketData[];
};

type MarketState = {
  customMarkets: MarketMeta[];
  customSubmarkets: SubmarketData[];

  addMarket: (input: {
    name: string;
    region: string;
    state: string;
    id?: string;
  }) => MarketMeta;
  removeMarket: (id: string) => { ok: boolean; reason?: string };
  addSubmarket: (data: SubmarketData) => { ok: boolean; reason?: string };
  removeSubmarket: (id: string) => { ok: boolean; reason?: string };
  importPack: (raw: unknown) => { ok: boolean; reason?: string; added: number };
  resetCustom: () => void;
  exportCustomPack: () => CustomPack;
};

function takenIds(
  customMarkets: MarketMeta[],
  customSubmarkets: SubmarketData[],
): { marketIds: Set<string>; submarketIds: Set<string> } {
  const marketIds = new Set([
    ...BASE_MARKETS.map((m) => m.id),
    ...customMarkets.map((m) => m.id),
  ]);
  const submarketIds = new Set([
    ...Object.keys(BASE_SUBMARKETS),
    ...customSubmarkets.map((s) => s.id),
  ]);
  return { marketIds, submarketIds };
}

function mergeMarkets(customMarkets: MarketMeta[]): MarketMeta[] {
  const map = new Map<string, MarketMeta>();
  for (const m of BASE_MARKETS) map.set(m.id, m);
  for (const m of customMarkets) map.set(m.id, { ...m, custom: true });
  return [...map.values()];
}

function mergeSubmarkets(
  customSubmarkets: SubmarketData[],
): Record<string, SubmarketData> {
  const map: Record<string, SubmarketData> = { ...BASE_SUBMARKETS };
  for (const s of customSubmarkets) {
    map[s.id] = { ...s, custom: true };
  }
  return map;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      customMarkets: [],
      customSubmarkets: [],

      addMarket: ({ name, region, state, id }) => {
        const { marketIds } = takenIds(
          get().customMarkets,
          get().customSubmarkets,
        );
        const mid = id
          ? uniqueSlug(id, marketIds)
          : uniqueSlug(name, marketIds);
        const meta: MarketMeta = {
          id: mid,
          name: name.trim(),
          region: region.trim(),
          state: state.trim().toUpperCase().slice(0, 2),
          custom: true,
        };
        set((s) => ({ customMarkets: [...s.customMarkets, meta] }));
        return meta;
      },

      removeMarket: (id) => {
        if (BASE_MARKETS.some((m) => m.id === id)) {
          return { ok: false, reason: "Built-in markets cannot be removed." };
        }
        const stillUsed = get().customSubmarkets.some(
          (s) => s.market_id === id,
        );
        if (stillUsed) {
          return {
            ok: false,
            reason: "Remove or reassign submarkets in this market first.",
          };
        }
        set((s) => ({
          customMarkets: s.customMarkets.filter((m) => m.id !== id),
        }));
        return { ok: true };
      },

      addSubmarket: (data) => {
        if (!isValidSubmarketPayload(data)) {
          return { ok: false, reason: "Invalid submarket payload." };
        }
        const markets = mergeMarkets(get().customMarkets);
        if (!markets.some((m) => m.id === data.market_id)) {
          return {
            ok: false,
            reason: `Unknown parent market “${data.market_id}”. Add the market first.`,
          };
        }
        const { submarketIds } = takenIds(
          get().customMarkets,
          get().customSubmarkets,
        );
        const id = data.id;
        if (submarketIds.has(id)) {
          if (BASE_SUBMARKETS[id]) {
            return {
              ok: false,
              reason: `Submarket id “${id}” is built-in and cannot be overwritten.`,
            };
          }
          set((s) => ({
            customSubmarkets: s.customSubmarkets.map((x) =>
              x.id === id ? { ...data, custom: true } : x,
            ),
          }));
          return { ok: true };
        }
        const payload: SubmarketData = { ...data, id, custom: true };
        set((s) => ({
          customSubmarkets: [...s.customSubmarkets, payload],
        }));
        return { ok: true };
      },

      removeSubmarket: (id) => {
        if (BASE_SUBMARKETS[id]) {
          return {
            ok: false,
            reason: "Built-in submarkets cannot be removed.",
          };
        }
        set((s) => ({
          customSubmarkets: s.customSubmarkets.filter((x) => x.id !== id),
        }));
        return { ok: true };
      },

      importPack: (raw) => {
        if (!raw || typeof raw !== "object") {
          return { ok: false, reason: "JSON must be an object.", added: 0 };
        }
        const o = raw as Record<string, unknown>;

        let marketsIn: MarketMeta[] = [];
        let subsIn: SubmarketData[] = [];

        if (isValidSubmarketPayload(raw)) {
          subsIn = [raw];
        } else if (Array.isArray(o.submarkets) || Array.isArray(o.markets)) {
          if (Array.isArray(o.markets)) {
            marketsIn = o.markets.filter(isValidMarketMeta).map((m) => ({
              ...m,
              region: m.region || "",
              custom: true,
            }));
          }
          if (Array.isArray(o.submarkets)) {
            subsIn = o.submarkets.filter(isValidSubmarketPayload);
          }
        } else if (Array.isArray(raw)) {
          subsIn = (raw as unknown[]).filter(isValidSubmarketPayload);
        } else {
          return {
            ok: false,
            reason:
              "Expected a submarket object, { markets, submarkets }, or an array of submarkets.",
            added: 0,
          };
        }

        let added = 0;
        for (const m of marketsIn) {
          const exists = mergeMarkets(get().customMarkets).some(
            (x) => x.id === m.id,
          );
          if (!exists) {
            get().addMarket({
              name: m.name,
              region: m.region || "",
              state: m.state,
              id: m.id,
            });
            added += 1;
          }
        }
        for (const s of subsIn) {
          if (!mergeMarkets(get().customMarkets).some((m) => m.id === s.market_id)) {
            get().addMarket({
              name: s.market_id,
              region: "",
              state: s.state || "NA",
              id: s.market_id,
            });
          }
          const res = get().addSubmarket(s);
          if (res.ok) added += 1;
        }
        if (added === 0) {
          return {
            ok: false,
            reason: "Nothing new was imported (ids may already exist).",
            added: 0,
          };
        }
        return { ok: true, added };
      },

      resetCustom: () => set({ customMarkets: [], customSubmarkets: [] }),

      exportCustomPack: () => ({
        markets: get().customMarkets,
        submarkets: get().customSubmarkets,
      }),
    }),
    {
      name: "metro-mm-custom-markets-v1",
      // Avoid SSR getServerSnapshot infinite-loop with persist
      skipHydration: true,
      partialize: (s) => ({
        customMarkets: s.customMarkets,
        customSubmarkets: s.customSubmarkets,
      }),
    },
  ),
);

/** Call once on the client to load browser-saved custom markets. */
export function rehydrateMarketStore() {
  return useMarketStore.persist.rehydrate();
}

/** Hook: reactive portfolio index. */
export function useMarketsIndex(): MarketsIndex {
  const customMarkets = useMarketStore((s) => s.customMarkets);
  const customSubmarkets = useMarketStore((s) => s.customSubmarkets);
  return useMemo(
    () =>
      buildIndex(
        mergeMarkets(customMarkets),
        Object.values(mergeSubmarkets(customSubmarkets)),
        BASE_AS_OF,
      ),
    [customMarkets, customSubmarkets],
  );
}

export function useSubmarket(id: string): SubmarketData | null {
  const customSubmarkets = useMarketStore((s) => s.customSubmarkets);
  return useMemo(() => {
    const map = mergeSubmarkets(customSubmarkets);
    return map[id] ?? null;
  }, [customSubmarkets, id]);
}

export function useMarketList(): MarketMeta[] {
  const customMarkets = useMarketStore((s) => s.customMarkets);
  return useMemo(() => mergeMarkets(customMarkets), [customMarkets]);
}
