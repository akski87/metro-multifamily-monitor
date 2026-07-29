# Metro Multifamily Market Monitor

**Live site:** [https://akski87.github.io/metro-multifamily-monitor/](https://akski87.github.io/metro-multifamily-monitor/)

Multi-market Class A multifamily rental dashboard for the NJ / NYC metro.

- **Portfolio overview** across parent markets and submarkets  
- **Submarket deep-dive**: live survey roll-up, asking vs net-eff, trends, unit mix, map, building set with in-market toggles  
- **Compare** view across submarkets  
- **Add markets** from the UI (demo comps or JSON import) without code changes  
- **Journal Square** ships with live survey snapshot data from the Journal Square Market Monitor pipeline  

## Quick start

```bash
npm install
npm run dev        # http://localhost:8080
npm run build
npm run typecheck
```

## Automated rent data

```bash
npm run scrape:sync     # pull latest Journal Square feed
npm run scrape:status   # last run per market
npm run scrape:all      # sync + multi-market scrapers
```

Journal Square is scraped by [journal-square-monitor](https://github.com/akski87/journal-square-monitor); this repo syncs that feed daily. Multi-market targets live in `scripts/scrape/registry.json`.

## Deploy (GitHub Pages)

```bash
npm run build:gh-pages   # writes dist-gh/
# Push dist-gh to the gh-pages branch, or use the Actions workflow on main
```

## Adding markets

### In the app
Open **Add markets** → create a parent market and submarket, generate demo comps, or import survey JSON. Custom entries persist in the browser; use **Export pack** to download them.

### In the repo (permanent)
1. Add parent market to `src/data/markets-catalog.json` if needed  
2. Drop `src/data/submarket-<id>.json` (full `SubmarketData` shape)  
3. Files matching `submarket-*.json` are auto-loaded — no import list to edit  

See [src/data/ADDING_MARKETS.md](src/data/ADDING_MARKETS.md).

## Stack

React 19 · TypeScript · Vite · TanStack Start/Router · Tailwind v4 · Recharts · Zustand

## Related

- Repo: [akski87/metro-multifamily-monitor](https://github.com/akski87/metro-multifamily-monitor)  
- Live Journal Square data source: [journal-square-monitor](https://akski87.github.io/journal-square-monitor/)
