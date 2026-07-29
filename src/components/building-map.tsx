import { useMemo, useState } from "react";
import type { Building } from "@/lib/market-types";
import { cn, formatNumber } from "@/lib/utils";

export function BuildingMap({
  buildings,
  inMarketIds,
  selectedId,
  onSelect,
  className,
}: {
  buildings: Building[];
  inMarketIds: Set<string>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const { points, bounds } = useMemo(() => {
    const withCoords = buildings.filter(
      (b) => b.lat != null && b.lng != null,
    ) as Array<Building & { lat: number; lng: number }>;
    if (!withCoords.length) {
      return {
        points: [] as Array<Building & { lat: number; lng: number; x: number; y: number; r: number }>,
        bounds: null,
      };
    }
    const lats = withCoords.map((b) => b.lat);
    const lngs = withCoords.map((b) => b.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat || 0.01) * 0.18 + 0.002;
    const padLng = (maxLng - minLng || 0.01) * 0.18 + 0.002;
    const b = {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    };
    const maxUnits = Math.max(...withCoords.map((x) => x.units || 1));
    const points = withCoords.map((building) => {
      const x =
        ((building.lng - b.minLng) / (b.maxLng - b.minLng || 1)) * 100;
      const y =
        (1 - (building.lat - b.minLat) / (b.maxLat - b.minLat || 1)) * 100;
      const r = 8 + Math.sqrt((building.units || 1) / maxUnits) * 18;
      return { ...building, x, y, r };
    });
    return { points, bounds: b };
  }, [buildings]);

  const active = points.find((p) => p.id === (hover || selectedId));

  if (!points.length) {
    return (
      <div
        className={cn(
          "panel flex h-72 items-center justify-center text-sm text-fg-muted",
          className,
        )}
      >
        No coordinates for this submarket.
      </div>
    );
  }

  return (
    <div className={cn("panel relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#1a2740_0%,transparent_55%),radial-gradient(ellipse_at_80%_80%,#181b22_0%,transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(#3a4150 1px, transparent 1px), linear-gradient(90deg, #3a4150 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        className="relative h-72 w-full sm:h-80"
        preserveAspectRatio="none"
      >
        {points.map((p) => {
          const inMkt = inMarketIds.has(p.id);
          const isActive = p.id === (hover || selectedId);
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={(p.r / 100) * 4.5 + (isActive ? 0.4 : 0)}
                fill={inMkt ? "#5b8def" : "#3a4150"}
                fillOpacity={isActive ? 0.95 : inMkt ? 0.75 : 0.45}
                stroke={isActive ? "#eef0f4" : "transparent"}
                strokeWidth={0.35}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(p.id)}
              />
            </g>
          );
        })}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-border bg-bg-elevated/95 px-3 py-2 text-xs shadow-lg backdrop-blur sm:right-auto sm:min-w-[220px]">
          <p className="font-medium text-fg">{active.name}</p>
          <p className="mt-0.5 text-fg-muted">{active.address}</p>
          <p className="mt-1 tabular text-fg-subtle">
            {formatNumber(active.units)} units ·{" "}
            {formatNumber(active.available_now ?? 0)} avail
            {!inMarketIds.has(active.id) ? " · excluded" : ""}
          </p>
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 text-[11px] text-fg-subtle">
          Marker size = unit count · teal = in-market
        </div>
      )}
    </div>
  );
}
