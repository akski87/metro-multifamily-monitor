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
  "generated_at": "2026-07-28T12:00:00Z",
  "live": false,
  "center": [40.8509, -73.9701],
  "buildings": [],
  "market_history": [],
  "avg_unit_sf": [],
  "data_quality": {
    "checked_at": "2026-07-28T12:00:00Z",
    "errors": [],
    "warnings": [],
    "quarantined_units": 0,
    "policy": ""
  },
  "description": "…"
}
```

Every file matching `submarket-*.json` is loaded automatically via `import.meta.glob`.
The portfolio index is derived from buildings + history — do not hand-edit a separate markets index.

## Submarket JSON shape

Matches the Journal Square export: `buildings[]` with `by_type`, `history`, concessions, lat/lng, plus top-level `market_history`.

Tip: generate in the UI → **Export pack** → rename a submarket entry to `submarket-<id>.json` → commit.
