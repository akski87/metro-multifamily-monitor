import type { Building } from "./market-types";
import { buildingAskingPsf, buildingNetPsf } from "./market-data";

export function buildingsToCsv(buildings: Building[]): string {
  const header = [
    "name",
    "address",
    "units",
    "available",
    "avail_pct",
    "ask_psf",
    "net_psf",
    "concession_pct",
    "mgmt",
    "year_built",
    "method",
    "source_url",
  ];
  const rows = buildings.map((b) => {
    const avail = b.available_now ?? 0;
    const pct = b.units ? ((avail / b.units) * 100).toFixed(2) : "";
    const conc = ((b.concession_pct ?? b.conc_derived_pct ?? 0) * 100).toFixed(2);
    return [
      csv(b.name),
      csv(b.address),
      b.units,
      avail,
      pct,
      buildingAskingPsf(b) ?? "",
      buildingNetPsf(b) ?? "",
      conc,
      csv(b.mgmt ?? ""),
      b.year_built ?? "",
      csv(b.method ?? ""),
      csv(b.source_url ?? ""),
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

function csv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
