import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChartColumn,
  FolderPlus,
  LayoutDashboard,
  MapPinned,
  Search,
  Star,
} from "lucide-react";
import { useAllSubmarkets, useMarketsIndex } from "@/lib/market-store";
import { useWatchlist } from "@/lib/watchlist";
import { formatCurrency } from "@/lib/utils";

export const COMMAND_OPEN_EVENT = "metro-command-open";

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMMAND_OPEN_EVENT));
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const index = useMarketsIndex();
  const submarkets = useAllSubmarkets();
  const watch = useWatchlist();

  const buildings = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      address: string;
      submarketId: string;
      submarketName: string;
      asking: number | null;
      watched: boolean;
    }> = [];
    for (const sm of submarkets) {
      for (const b of sm.buildings) {
        const last = Object.values(b.by_type || {}).find((m) => m?.asking_avg);
        rows.push({
          id: b.id,
          name: b.name,
          address: b.address,
          submarketId: sm.id,
          submarketName: sm.name,
          asking: last?.asking_avg ?? null,
          watched: watch.has(b.id),
        });
      }
    }
    return rows;
  }, [submarkets, watch.ids]);

  const watched = buildings.filter((b) => b.watched);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_OPEN_EVENT, onOpen);
    };
  }, []);

  function goMarket(submarketId: string, building?: string) {
    setOpen(false);
    void navigate({
      to: "/market/$submarketId",
      params: { submarketId },
      search: building ? { building } : {},
    });
  }

  function go(to: "/" | "/compare" | "/manage") {
    setOpen(false);
    void navigate({ to });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-bg/70"
        aria-label="Close search"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,560px)] overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-2xl">
        <Command label="Jump to market" className="text-fg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-fg-subtle" />
            <Command.Input
              autoFocus
              placeholder="Jump to a market or building…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-fg-subtle"
            />
            <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle sm:inline">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto scroll-thin p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-fg-muted">
              No matches
            </Command.Empty>
            <Command.Group
              heading="Go"
              className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
            >
              <Item
                onSelect={() => go("/")}
                icon={LayoutDashboard}
                label="Portfolio"
              />
              <Item
                onSelect={() => go("/compare")}
                icon={ChartColumn}
                label="Compare"
              />
              <Item
                onSelect={() => go("/manage")}
                icon={FolderPlus}
                label="Add markets"
              />
            </Command.Group>
            {watched.length > 0 ? (
              <Command.Group
                heading="Watchlist"
                className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
              >
                {watched.map((b) => (
                  <Command.Item
                    key={`w-${b.id}`}
                    value={`watch ${b.name} ${b.address} ${b.submarketName}`}
                    onSelect={() => goMarket(b.submarketId, b.id)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-fg aria-selected:bg-bg-subtle"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {b.submarketName}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            <Command.Group
              heading="Submarkets"
              className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
            >
              {index.submarkets.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`${s.name} ${s.city} ${s.market_name} ${s.id}`}
                  onSelect={() => goMarket(s.id)}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-fg aria-selected:bg-bg-subtle"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPinned className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="shrink-0 tabular text-xs text-fg-subtle">
                    {formatCurrency(s.asking_avg)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group
              heading="Buildings"
              className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
            >
              {buildings.map((b) => (
                <Command.Item
                  key={b.id}
                  value={`${b.name} ${b.address} ${b.submarketName} ${b.id}`}
                  onSelect={() => goMarket(b.submarketId, b.id)}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-fg aria-selected:bg-bg-subtle"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                    <span className="truncate">{b.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {b.submarketName}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  onSelect,
  icon: Icon,
  label,
}: {
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg aria-selected:bg-bg-subtle"
    >
      <Icon className="h-3.5 w-3.5 text-fg-subtle" />
      {label}
    </Command.Item>
  );
}
