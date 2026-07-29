export type UnitType = "Studio" | "1BR" | "2BR" | "3BR";

export type TypeMetrics = {
  count: number;
  asking_avg: number;
  net_avg: number | null;
  sqft_avg: number | null;
  asking_min: number | null;
  asking_max: number | null;
  net_min: number | null;
  net_max: number | null;
  asking_psf: number | null;
  net_psf: number | null;
  psf_n: number | null;
};

export type Building = {
  id: string;
  name: string;
  units: number;
  address: string;
  lat: number | null;
  lng: number | null;
  year_built?: number | null;
  stories?: number | null;
  mgmt?: string | null;
  in_market: boolean;
  method?: string | null;
  source_url?: string | null;
  portal_url?: string | null;
  available_now: number | null;
  concession_text?: string | null;
  concession_pct?: number | null;
  conc_derived_pct?: number | null;
  as_of?: string | null;
  by_type: Partial<Record<UnitType | string, TypeMetrics>>;
  history?: Array<{ date: string; n: number; ne: number | null }>;
  unit_mix?: { studio: number; br1: number; br2: number; br3: number };
  submarket_id?: string;
};

export type MarketHistoryPoint = {
  date: string;
  total_available: number;
  by_type: Partial<
    Record<UnitType | string, { asking: number; net: number }>
  >;
  note?: string;
  all_asking: number;
  all_net: number;
};

export type MarketMeta = {
  id: string;
  name: string;
  region: string;
  state: string;
  /** true when added from the Manage UI (not baked into repo data) */
  custom?: boolean;
};

export type SubmarketData = {
  id: string;
  name: string;
  market_id: string;
  city: string;
  state: string;
  as_of: string;
  generated_at: string;
  live: boolean;
  center: number[];
  buildings: Building[];
  market_history: MarketHistoryPoint[];
  avg_unit_sf: Array<{
    t: string;
    n: number;
    avg_sqft: number;
    min_sqft: number;
    max_sqft: number;
  }>;
  data_quality: {
    checked_at: string;
    errors: string[];
    warnings: string[];
    quarantined_units: number;
    policy: string;
  };
  description: string;
  /** true when added from the Manage UI */
  custom?: boolean;
};

export type SubmarketSummary = {
  id: string;
  name: string;
  market_id: string;
  market_name: string;
  city: string;
  state: string;
  live: boolean;
  building_count: number;
  total_units: number;
  available: number;
  avail_pct: number;
  asking_avg: number | null;
  net_avg: number | null;
  concession_avg: number;
  psf_avg: number | null;
  center: number[];
  by_type?: Partial<
    Record<UnitType | string, { asking: number; net: number }>
  >;
  trend_7d_ask: number | null;
  custom?: boolean;
};

export type MarketsIndex = {
  as_of: string;
  markets: Array<MarketMeta & { submarket_ids: string[] }>;
  submarkets: SubmarketSummary[];
};

export const UNIT_TYPES: UnitType[] = ["Studio", "1BR", "2BR", "3BR"];
