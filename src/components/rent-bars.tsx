import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatPsf } from "@/lib/utils";

export function RentBars({
  data,
  height = 280,
}: {
  data: Array<{
    type: string;
    asking: number | null;
    net: number | null;
    askingPsf: number | null;
    netPsf: number | null;
    count: number;
  }>;
  height?: number;
}) {
  const chartData = data.map((d) => ({
    ...d,
    asking: d.asking ?? 0,
    net: d.net ?? 0,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="type"
            tick={{ fill: "#9aa3b2", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7380", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#12141a",
              border: "1px solid #2a2f3a",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value: number, name: string, props) => {
              const row = props.payload as {
                askingPsf: number | null;
                netPsf: number | null;
                count: number;
              };
              if (name === "asking")
                return [
                  `${formatCurrency(value)} · ${formatPsf(row.askingPsf)}/sf/yr · n=${row.count}`,
                  "Asking",
                ];
              return [
                `${formatCurrency(value)} · ${formatPsf(row.netPsf)}/sf/yr`,
                "Net-eff",
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(v) => (v === "asking" ? "Asking" : "Net-eff")}
          />
          <Bar dataKey="asking" fill="#5b8def" radius={[6, 6, 0, 0]} maxBarSize={48}>
            <LabelList
              dataKey="askingPsf"
              position="top"
              formatter={(v: number) => (v ? `$${v.toFixed(0)}` : "")}
              style={{ fill: "#6b7380", fontSize: 10 }}
            />
          </Bar>
          <Bar dataKey="net" fill="#7ec8a3" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
