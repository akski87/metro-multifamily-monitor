/** Vacancy tone: low is healthy, high is stressed. */
export function vacancyTone(
  pct: number | null | undefined,
): "positive" | "warning" | "negative" | "muted" {
  if (pct == null || Number.isNaN(pct)) return "muted";
  if (pct < 6) return "positive";
  if (pct < 12) return "warning";
  return "negative";
}

export function vacancyTextClass(pct: number | null | undefined) {
  const t = vacancyTone(pct);
  if (t === "positive") return "text-positive";
  if (t === "warning") return "text-warning";
  if (t === "negative") return "text-negative";
  return "text-fg-subtle";
}

export function vacancyFill(pct: number | null | undefined) {
  const t = vacancyTone(pct);
  if (t === "positive") return "var(--color-positive)";
  if (t === "warning") return "var(--color-warning)";
  if (t === "negative") return "var(--color-negative)";
  return "var(--color-border-strong)";
}

/** 0–1 rank → accent mix % for heatmap cells (tokenized, no raw hex). */
export function heatMix(rank01: number) {
  const r = Math.min(1, Math.max(0, rank01));
  return Math.round(10 + r * 42);
}
