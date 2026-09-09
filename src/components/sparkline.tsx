import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  color = "var(--color-accent)",
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const pts = values.filter((v) => v != null && !Number.isNaN(v));
  if (pts.length < 2) {
    return <span className={cn("inline-block h-6 w-16", className)} />;
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const w = 72;
  const h = 24;
  const d = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = pts[pts.length - 1] >= pts[0];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("inline-block h-6 w-16", className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={up ? "var(--color-negative)" : color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
