import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ChartColumn,
  FolderPlus,
  LayoutDashboard,
  MapPinned,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { rehydrateMarketStore, useMarketsIndex } from "@/lib/market-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const index = useMarketsIndex();

  useEffect(() => {
    void rehydrateMarketStore();
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-bg-elevated lg:flex lg:flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link to="/" className="block">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                Market Monitor
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight">
                Metro Multifamily
              </h1>
            </Link>
            <p className="mt-2 text-xs text-fg-muted">
              {index.submarkets.length} submarkets · as of {index.as_of}
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto scroll-thin p-3">
            <NavLink to="/" active={pathname === "/"} icon={LayoutDashboard}>
              Portfolio
            </NavLink>
            <NavLink
              to="/compare"
              active={pathname.startsWith("/compare")}
              icon={ChartColumn}
            >
              Compare
            </NavLink>
            <NavLink
              to="/manage"
              active={pathname.startsWith("/manage")}
              icon={FolderPlus}
            >
              Add markets
            </NavLink>
            <p className="mb-2 mt-5 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
              Markets
            </p>
            {index.markets.map((m) => (
              <div key={m.id} className="mb-3">
                <p className="mb-1 px-3 text-xs font-medium text-fg-muted">
                  {m.name}
                  <span className="ml-1 text-fg-subtle">{m.state}</span>
                  {m.custom ? (
                    <Badge
                      variant="demo"
                      className="ml-1 px-1.5 py-0 text-[10px]"
                    >
                      Custom
                    </Badge>
                  ) : null}
                </p>
                <div className="space-y-0.5">
                  {m.submarket_ids.map((sid) => {
                    const sm = index.submarkets.find((s) => s.id === sid);
                    if (!sm) return null;
                    const active = pathname === `/market/${sid}`;
                    return (
                      <Link
                        key={sid}
                        to="/market/$submarketId"
                        params={{ submarketId: sid }}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-accent-soft text-fg"
                            : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <MapPinned className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{sm.name}</span>
                        </span>
                        {sm.live ? (
                          <Badge
                            variant="live"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            Live
                          </Badge>
                        ) : sm.custom ? (
                          <Badge
                            variant="demo"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            New
                          </Badge>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-border p-4 text-xs text-fg-subtle">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              Journal Square uses live survey data.
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-sm font-semibold">Metro Multifamily</p>
                <p className="text-[11px] text-fg-subtle">Market Monitor</p>
              </div>
            </div>
            <div className="hidden text-sm text-fg-muted lg:block">
              Class A rental comps across NJ / NYC metro
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link to="/manage">
                  <FolderPlus className="h-3.5 w-3.5" />
                  Add market
                </Link>
              </Button>
              <Badge variant="outline" className="tabular">
                Snapshot {index.as_of}
              </Badge>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(88vw,300px)] flex-col bg-bg-elevated shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <p className="font-semibold">Markets</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto scroll-thin p-3">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="mb-1 block rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-bg-subtle"
              >
                Portfolio
              </Link>
              <Link
                to="/compare"
                onClick={() => setOpen(false)}
                className="mb-1 block rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-bg-subtle"
              >
                Compare
              </Link>
              <Link
                to="/manage"
                onClick={() => setOpen(false)}
                className="mb-4 block rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-bg-subtle"
              >
                Add markets
              </Link>
              {index.markets.map((m) => (
                <div key={m.id} className="mb-3">
                  <p className="mb-1 px-3 text-xs font-medium text-fg-muted">
                    {m.name}
                  </p>
                  {m.submarket_ids.map((sid) => {
                    const sm = index.submarkets.find((s) => s.id === sid);
                    if (!sm) return null;
                    return (
                      <Link
                        key={sid}
                        to="/market/$submarketId"
                        params={{ submarketId: sid }}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
                      >
                        {sm.name}
                        {sm.live ? <Badge variant="live">Live</Badge> : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  to,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-accent-soft text-fg"
          : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
      )}
    >
      <Icon className="h-4 w-4 opacity-70" />
      {children}
    </Link>
  );
}
