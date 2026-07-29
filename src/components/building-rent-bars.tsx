import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Building, TypeMetrics, UnitType } from "@/lib/market-types";
import { formatCurrency } from "@/lib/utils";

export function BuildingRentBars({
  buildings,
  unitType,
  height = 300,
}: {
  buildings: Building[];
  unitType: UnitType | "All";
  height?: number;
}) {
  const rows = buildings
    .map((b) => {
      if (unitType === "All") {
        const types = Object.values(b.by_type || {}).filter(
          (t): t is TypeMetrics => !!t,
        );
        if (!types.length) return null;
        let askSum = 0;
        let netSum = 0;
        let askW = 0;
        let netW = 0;
        for (const t of types) {
          if (t.asking_avg != null) {
            askSum += t.asking_avg * (t.count || 1);
            askW += t.count || 1;
          }
          if (t.net_avg != null) {
            netSum += t.net_avg * (t.count || 1);
            netW += t.count || 1;
          }
        }
        const asking = askW ? askSum / askW : null;
        const net = netW ? netSum / netW : asking;
        if (asking == null) return null;
        return {
          name: b.name,
          asking,
          net: net ?? asking,
          concession: asking && net ? Math.max(0, asking - net) : 0,
          short: b.name.length > 14 ? b.name.slice(0, 12) + "…" : b.name,
        };
      }
      const t = b.by_type?.[unitType];
      if (!t?.asking_avg) return null;
      const net = t.net_avg ?? t.asking_avg;
      return {
        name: b.name,
        asking: t.asking_avg,
        net,
        concession: Math.max(0, t.asking_avg - net),
        short: b.name.length > 14 ? b.name.slice(0, 12) + "…" : b.name,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.net ?? 0) - (b!.net ?? 0)) as Array<{
    name: string;
    asking: number;
    net: number;
    concession: number;
    short: string;
  }>;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#6b7380", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`}
          />
          <YAxis
            type="category"
            dataKey="short"
            width={100}
            tick={{ fill: "#9aa3b2", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#12141a",
              border: "1px solid #2a2f3a",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "net" ? "Net-eff" : name === "concession" ? "Concession Δ" : "Asking",
            ]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { name?: string })?.name ?? ""
            }
          />
          <Bar dataKey="net" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={18}>
            {rows.map((_, i) => (
              <Cell key={i} fill="#5b8def" />
            ))}
          </Bar>
          <Bar dataKey="concession" stackId="a" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {rows.map((_, i) => (
              <Cell key={i} fill="#3a4150" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
