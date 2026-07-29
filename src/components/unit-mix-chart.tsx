import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatNumber, formatPct } from "@/lib/utils";

const COLORS = ["#5b8def", "#7ec8a3", "#c4a57a", "#9aa3b2"];

export function UnitMixChart({
  mix,
  height = 240,
}: {
  mix: { studio: number; br1: number; br2: number; br3: number; total: number };
  height?: number;
}) {
  const data = [
    { name: "Studio", value: mix.studio },
    { name: "1 BR", value: mix.br1 },
    { name: "2 BR", value: mix.br2 },
    { name: "3 BR", value: mix.br3 },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#12141a",
                border: "1px solid #2a2f3a",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `${formatNumber(value)} units (${formatPct((value / (mix.total || 1)) * 100)})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-fg-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="tabular text-fg">
              {formatNumber(d.value)}{" "}
              <span className="text-fg-subtle">
                ({formatPct((d.value / (mix.total || 1)) * 100, 0)})
              </span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-6 border-t border-border pt-2 font-medium">
          <span className="text-fg-muted">Total</span>
          <span className="tabular">{formatNumber(mix.total)}</span>
        </li>
      </ul>
    </div>
  );
}
