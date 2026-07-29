import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketHistoryPoint } from "@/lib/market-types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function TrendChart({
  history,
  height = 280,
}: {
  history: MarketHistoryPoint[];
  height?: number;
}) {
  const data = history.map((h) => ({
    date: h.date.slice(5),
    fullDate: h.date,
    asking: h.all_asking,
    net: h.all_net,
    available: h.total_available,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="askFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b8def" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#5b8def" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7ec8a3" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#7ec8a3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7380", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            yAxisId="rent"
            tick={{ fill: "#6b7380", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => `$${Math.round(v / 100) / 10}k`}
          />
          <YAxis
            yAxisId="avail"
            orientation="right"
            tick={{ fill: "#6b7380", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#12141a",
              border: "1px solid #2a2f3a",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#9aa3b2" }}
            formatter={(value: number, name: string) => {
              if (name === "available") return [formatNumber(value), "Available"];
              if (name === "asking") return [formatCurrency(value), "Asking"];
              if (name === "net") return [formatCurrency(value), "Net-eff"];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#9aa3b2" }}
            formatter={(v) =>
              v === "asking" ? "Asking" : v === "net" ? "Net-eff" : "Available"
            }
          />
          <Area
            yAxisId="rent"
            type="monotone"
            dataKey="asking"
            stroke="#5b8def"
            fill="url(#askFill)"
            strokeWidth={2}
            dot={false}
          />
          <Area
            yAxisId="rent"
            type="monotone"
            dataKey="net"
            stroke="#7ec8a3"
            fill="url(#netFill)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="avail"
            type="monotone"
            dataKey="available"
            stroke="#c4a57a"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
