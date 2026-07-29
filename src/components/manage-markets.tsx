import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  FileJson,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMarketList,
  useMarketStore,
  useMarketsIndex,
} from "@/lib/market-store";
import {
  emptySubmarket,
  generateSubmarket,
} from "@/lib/generate-submarket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";
import type { SubmarketData } from "@/lib/market-types";

export function ManageMarkets() {
  const index = useMarketsIndex();
  const markets = useMarketList();
  const customMarkets = useMarketStore((s) => s.customMarkets);
  const customSubmarkets = useMarketStore((s) => s.customSubmarkets);
  const addMarket = useMarketStore((s) => s.addMarket);
  const addSubmarket = useMarketStore((s) => s.addSubmarket);
  const removeMarket = useMarketStore((s) => s.removeMarket);
  const removeSubmarket = useMarketStore((s) => s.removeSubmarket);
  const importPack = useMarketStore((s) => s.importPack);
  const resetCustom = useMarketStore((s) => s.resetCustom);
  const exportCustomPack = useMarketStore((s) => s.exportCustomPack);
  const navigate = useNavigate();

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
          Expand coverage
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Add markets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Grow the portfolio without touching code. Add a parent market, then a
          submarket with demo comps — or paste full survey JSON. Custom entries
          save in this browser and show up in Portfolio, Compare, and the
          sidebar immediately.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Parent markets"
          value={formatNumber(index.markets.length)}
          hint={`${customMarkets.length} custom`}
        />
        <Stat
          label="Submarkets"
          value={formatNumber(index.submarkets.length)}
          hint={`${customSubmarkets.length} custom`}
        />
        <Stat
          label="How to ship permanently"
          value="JSON file"
          hint="Drop submarket-*.json in data/"
        />
      </div>

      <section className="panel p-4 sm:p-6">
        <SectionHeader
          title="Create"
          description="Three paths: parent market, generated submarket, or raw JSON import."
          className="mb-4"
        />
        <Tabs defaultValue="submarket">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="submarket">Submarket</TabsTrigger>
            <TabsTrigger value="market">Parent market</TabsTrigger>
            <TabsTrigger value="import">Import JSON</TabsTrigger>
            <TabsTrigger value="ship">Ship in repo</TabsTrigger>
          </TabsList>

          <TabsContent value="submarket">
            <AddSubmarketForm
              markets={markets}
              onCreated={(id) => {
                toast.success("Submarket added");
                navigate({
                  to: "/market/$submarketId",
                  params: { submarketId: id },
                });
              }}
              addSubmarket={addSubmarket}
            />
          </TabsContent>

          <TabsContent value="market">
            <AddMarketForm
              onCreated={(id) => {
                toast.success(`Market “${id}” added — now add a submarket`);
              }}
              addMarket={addMarket}
            />
          </TabsContent>

          <TabsContent value="import">
            <ImportJsonForm
              onImport={(raw) => {
                const res = importPack(raw);
                if (res.ok) toast.success(`Imported ${res.added} item(s)`);
                else toast.error(res.reason || "Import failed");
                return res.ok;
              }}
            />
          </TabsContent>

          <TabsContent value="ship">
            <ShipGuide />
          </TabsContent>
        </Tabs>
      </section>

      <section>
        <SectionHeader
          title="Your custom additions"
          description="Stored in this browser. Export a pack to share or commit later."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const pack = exportCustomPack();
                  const blob = new Blob([JSON.stringify(pack, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "custom-markets-pack.json";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Pack downloaded");
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Export pack
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      "Remove all custom markets and submarkets from this browser?",
                    )
                  ) {
                    resetCustom();
                    toast.message("Custom markets cleared");
                  }
                }}
              >
                Reset custom
              </Button>
            </div>
          }
        />

        {customMarkets.length === 0 && customSubmarkets.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-fg-muted">
            No custom markets yet. Add a parent market or submarket above.
          </div>
        ) : (
          <div className="space-y-4">
            {customMarkets.length > 0 ? (
              <div className="panel overflow-hidden">
                <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  Parent markets
                </div>
                <ul className="divide-y divide-border">
                  {customMarkets.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-fg-subtle">
                          {m.id} · {m.region || "—"} · {m.state}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${m.name}`}
                        onClick={() => {
                          const res = removeMarket(m.id);
                          if (!res.ok) toast.error(res.reason);
                          else toast.message("Market removed");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-fg-muted" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {customSubmarkets.length > 0 ? (
              <div className="panel overflow-hidden">
                <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  Submarkets
                </div>
                <ul className="divide-y divide-border">
                  {customSubmarkets.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to="/market/$submarketId"
                            params={{ submarketId: s.id }}
                            className="font-medium text-fg hover:text-accent"
                          >
                            {s.name}
                          </Link>
                          <Badge variant="demo">Custom</Badge>
                        </div>
                        <p className="text-xs text-fg-subtle">
                          {s.id} · parent {s.market_id} ·{" "}
                          {s.buildings.length} buildings · {s.city}, {s.state}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${s.name}`}
                        onClick={() => {
                          const res = removeSubmarket(s.id);
                          if (!res.ok) toast.error(res.reason);
                          else toast.message("Submarket removed");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-fg-muted" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-fg-muted">{hint}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AddMarketForm({
  addMarket,
  onCreated,
}: {
  addMarket: (i: {
    name: string;
    region: string;
    state: string;
    id?: string;
  }) => { id: string };
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !state.trim()) {
          toast.error("Name and state are required");
          return;
        }
        const m = addMarket({ name, region, state });
        setName("");
        setRegion("");
        setState("");
        onCreated(m.id);
      }}
    >
      <Field label="Market name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bergen County"
          required
        />
      </Field>
      <Field label="State">
        <Input
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="NJ"
          maxLength={2}
          required
        />
      </Field>
      <Field label="Region">
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Northern New Jersey"
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add parent market
        </Button>
      </div>
    </form>
  );
}

function AddSubmarketForm({
  markets,
  addSubmarket,
  onCreated,
}: {
  markets: Array<{ id: string; name: string; state: string }>;
  addSubmarket: (d: SubmarketData) => {
    ok: boolean;
    reason?: string;
  };
  onCreated: (id: string) => void;
}) {
  const [marketId, setMarketId] = useState(markets[0]?.id ?? "");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(markets[0]?.state ?? "NJ");
  const [lat, setLat] = useState("40.74");
  const [lng, setLng] = useState("-74.03");
  const [buildings, setBuildings] = useState("8");
  const [studio, setStudio] = useState("3200");
  const [br1, setBr1] = useState("3900");
  const [br2, setBr2] = useState("5500");
  const [br3, setBr3] = useState("7000");
  const [conc, setConc] = useState("8");
  const [avail, setAvail] = useState("3");
  const [mode, setMode] = useState<"generate" | "empty">("generate");

  const parentOptions = useMemo(() => markets, [markets]);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!marketId) {
          toast.error("Pick a parent market first");
          return;
        }
        if (!name.trim() || !city.trim()) {
          toast.error("Name and city are required");
          return;
        }
        const latN = Number(lat);
        const lngN = Number(lng);
        if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
          toast.error("Lat/lng must be numbers");
          return;
        }

        const data =
          mode === "empty"
            ? emptySubmarket({
                name,
                marketId,
                city,
                state,
                lat: latN,
                lng: lngN,
              })
            : generateSubmarket({
                name,
                marketId,
                city,
                state,
                lat: latN,
                lng: lngN,
                buildingCount: Number(buildings) || 6,
                studioRent: Number(studio) || 3000,
                oneBrRent: Number(br1) || 3800,
                twoBrRent: Number(br2) || 5400,
                threeBrRent: Number(br3) || 6800,
                concessionRate: (Number(conc) || 0) / 100,
                availabilityRate: (Number(avail) || 3) / 100,
              });

        const res = addSubmarket(data);
        if (!res.ok) {
          toast.error(res.reason || "Could not add submarket");
          return;
        }
        onCreated(data.id);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parent market">
          <Select
            value={marketId}
            onValueChange={(v) => {
              setMarketId(v);
              const m = parentOptions.find((x) => x.id === v);
              if (m?.state) setState(m.state);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {parentOptions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.state})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Submarket name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weehawken Waterfront"
            required
          />
        </Field>
        <Field label="City">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Weehawken"
            required
          />
        </Field>
        <Field label="State">
          <Input
            value={state}
            onChange={(e) => setState(e.target.value)}
            maxLength={2}
            required
          />
        </Field>
        <Field label="Center lat">
          <Input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Center lng">
          <Input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "generate" ? "default" : "secondary"}
          onClick={() => setMode("generate")}
        >
          Generate demo comps
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "empty" ? "default" : "secondary"}
          onClick={() => setMode("empty")}
        >
          Empty shell
        </Button>
      </div>

      {mode === "generate" ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Buildings">
            <Input
              value={buildings}
              onChange={(e) => setBuildings(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="Studio ask">
            <Input
              value={studio}
              onChange={(e) => setStudio(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="1BR ask">
            <Input
              value={br1}
              onChange={(e) => setBr1(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="2BR ask">
            <Input
              value={br2}
              onChange={(e) => setBr2(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="3BR ask">
            <Input
              value={br3}
              onChange={(e) => setBr3(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label="Concession %">
            <Input
              value={conc}
              onChange={(e) => setConc(e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Avail rate %">
            <Input
              value={avail}
              onChange={(e) => setAvail(e.target.value)}
              inputMode="decimal"
            />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          Creates an empty submarket you can fill later via Import JSON (same
          shape as your Journal Square export).
        </p>
      )}

      <Button type="submit">
        <Plus className="h-4 w-4" />
        {mode === "generate" ? "Generate & add submarket" : "Add empty submarket"}
      </Button>
    </form>
  );
}

function ImportJsonForm({
  onImport,
}: {
  onImport: (raw: unknown) => boolean;
}) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">
        Paste a full submarket payload (buildings + history), a{" "}
        <code className="text-fg">{"{ markets, submarkets }"}</code> pack, or
        an array of submarkets.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 font-mono text-xs text-fg placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder='{ "id": "my-submarket", "name": "...", "market_id": "...", "buildings": [ ... ] }'
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            try {
              const raw = JSON.parse(text);
              if (onImport(raw)) setText("");
            } catch {
              toast.error("Invalid JSON");
            }
          }}
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <label className="inline-flex cursor-pointer">
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const raw = JSON.parse(await file.text());
                onImport(raw);
              } catch {
                toast.error("Could not parse file");
              }
              e.target.value = "";
            }}
          />
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-bg-subtle px-4 text-sm font-medium text-fg hover:bg-bg-muted">
            <FileJson className="h-4 w-4" />
            Upload file
          </span>
        </label>
      </div>
    </div>
  );
}

function ShipGuide() {
  return (
    <div className="space-y-4 text-sm text-fg-muted">
      <p>
        Custom entries in this UI live in browser storage. To make a market part
        of the permanent product build:
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          If it is a new parent market, add one object to{" "}
          <code className="text-fg">src/data/markets-catalog.json</code>.
        </li>
        <li>
          Export your custom pack (or save a single submarket JSON) as{" "}
          <code className="text-fg">{"src/data/submarket-<id>.json"}</code>.
        </li>
        <li>
          Redeploy. The catalog auto-loads every{" "}
          <code className="text-fg">submarket-*.json</code> file — no import
          list, no dashboard code changes.
        </li>
      </ol>
      <div className="panel-inner p-4 font-mono text-xs text-fg">
        {`// markets-catalog.json
{ "id": "bergen", "name": "Bergen County", "region": "Northern New Jersey", "state": "NJ" }

// submarket-fort-lee.json  (full SubmarketData)
{ "id": "fort-lee", "market_id": "bergen", "name": "Fort Lee", "buildings": [ ... ] }`}
      </div>
    </div>
  );
}
