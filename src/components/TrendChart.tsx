"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LINE_COLORS = [
  "#f4805a",
  "#6aab79",
  "#e8c15c",
  "#7aa7c7",
  "#b58ac9",
  "#d97a9c",
];

export function TrendChart({
  data,
  players,
}: {
  data: Record<string, number | string>[];
  players: string[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#fbe4cd" />
          <XAxis
            dataKey="puzzle"
            tick={{ fontSize: 11, fill: "#93877a" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#93877a" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #fbe4cd",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {players.map((player, i) => (
            <Line
              key={player}
              type="monotone"
              dataKey={player}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
