# Adding markets

Two ways to grow the portfolio:

## 1. In the app (fastest)

Open **Add markets** in the sidebar (or header).

| Action | What it does |
| --- | --- |
| **Parent market** | Creates a container (e.g. Bergen County) |
| **Submarket** | Generates demo comps or an empty shell under a parent |
| **Import JSON** | Pastes / uploads full survey payloads |
| **Export pack** | Downloads your custom markets for backup or commit |
| **Pipeline panel** | Shows last automated rent sync status |

Custom entries are stored in this browser and appear in Portfolio, Compare, and the sidebar immediately.

## 2. In the repo (permanent)

No code registration. Auto-discovery:

1. **Parent market** (if new) — add to `markets-catalog.json`:

```json
{
  "id": "bergen",
  "name": "Bergen County",
  "region": "Northern New Jersey",
  "state": "NJ"
}
```

2. **Submarket payload** — add `submarket-<id>.json` in this folder:

```json
{
  "id": "fort-lee",
  "name": "Fort Lee",
  "market_id": "bergen",
  "city": "Fort Lee",
  "state": "NJ",
  "as_of": "2026-07-28",
  "generated_at": "2026-07-28T00:00:00Z",
  "live": true,
  "center": [40.85, -73.97],
  "buildings": [],
  "market_history": [],
  "avg_unit_sf": [],
  "data_quality": {
    "checked_at": "2026-07-28T00:00:00Z",
    "errors": [],
    "warnings": [],
    "quarantined_units": 0,
    "policy": ""
  },
  "description": ""
}
```

Files matching `submarket-*.json` are auto-loaded.

## 3. Automated rent scraping

See **[scripts/scrape/README.md](../../scripts/scrape/README.md)**.

| Market | How data stays fresh |
| --- | --- |
| **Journal Square** | Upstream daily scrape in `journal-square-monitor` → `npm run scrape:sync` pulls the public feed |
| **Other live markets** | Add buildings to `scripts/scrape/registry.json` with a supported method (`sightmap_api`, …) |

Daily GitHub Action: `.github/workflows/daily-data-sync.yml` (sync → commit → redeploy Pages).
