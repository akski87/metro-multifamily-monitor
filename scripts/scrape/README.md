# Automated rent data scraping

This dashboard has **two data paths**:

| Path | What | How |
|---|---|---|
| **Journal Square (live)** | Your full Class A comp set (13 buildings) | Upstream daily scrape in [`journal-square-monitor`](https://github.com/akski87/journal-square-monitor) → this repo **syncs** the published feed |
| **Other submarkets** | Expandable | `registry.json` + platform adapters (SightMap, Rose, Modern Spaces, DOM) |

We intentionally **do not re-scrape Journal Square here**. Your existing Playwright extractors, concession logic, SQLite history, and CI are the source of truth.

## Quick commands

```bash
# Pull latest JSQ feed into src/data/submarket-journal-square.json
npm run scrape:sync

# Show last run status per market
npm run scrape:status

# Run enabled multi-market scrapers (registry.json)
npm run scrape:run

# Sync + scrape everything
npm run scrape:all
```

## Daily automation (GitHub Actions)

`.github/workflows/daily-data-sync.yml` runs every day after the JSQ pull:

1. `npm run scrape:sync` — refresh Journal Square from the public feed  
2. `npm run scrape:run` — any enabled multi-market scrapers  
3. Commit updated `src/data/*` if changed  
4. Rebuild + deploy GitHub Pages  

Schedule: `15 13 * * *` UTC (~9:15am ET), after JSQ’s `43 11 * * *` UTC job.

## Adding a building to scrape

1. Open [`registry.json`](./registry.json).  
2. Under a submarket with `"mode": "scrape"`, add a building:

```json
{
  "id": "my_building",
  "name": "My Building",
  "units": 300,
  "address": "123 Main St",
  "lat": 40.72,
  "lng": -74.04,
  "method": "sightmap_api",
  "enabled": true,
  "url": "https://example.com/availability",
  "api_endpoint": "https://sightmap.com/app/api/v1/ORG/sightmaps/ID"
}
```

3. Supported methods today:
   - `sightmap_api` — pure HTTP, CI-safe  
   - (more adapters: Rose / Modern Spaces / DOM — same patterns as your JSQ `scrape.py`)

4. Run `npm run scrape:run` and check `src/data/submarket-<id>.json`.

## Journal Square upstream

| Item | Value |
|---|---|
| Feed | https://akski87.github.io/journal-square-monitor/dashboard_data.json |
| Scraper | https://github.com/akski87/journal-square-monitor (`scrape.py` + Actions) |
| Sync script | `scripts/scrape/sync-journal-square.mjs` |

## Legal / etiquette

- Scrape only public availability pages for your own market research.  
- Rate-limit (one building at a time, short settles).  
- Prefer first-party JSON APIs (SightMap) over heavy DOM when available.  
- Respect site terms; disable a building (`enabled: false`) if blocked.  
