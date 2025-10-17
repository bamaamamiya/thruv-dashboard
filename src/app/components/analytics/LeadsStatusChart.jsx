import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const LeadsStatusChart = ({ data }) => {
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () =>
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Enhanced data: pendingForChart hanya 2 kalau pending = 0
  const enhancedData = data.map((item) => ({
    ...item,
    complete: item.complete || 0,
    pending: item.pending || 0,
    pendingForChart: item.pending === 0 ? 2 : item.pending,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const complete = payload.find((p) => p.dataKey === "complete")?.value || 0;
    const pending = payload.find((p) => p.dataKey === "pending")?.value || 0;

    return (
      <div
        className={`px-3 py-2 rounded-md shadow-md border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-gray-100"
            : "bg-white border-gray-300 text-black"
        }`}
      >
        <p className="text-sm text-emerald-500">{`Complete Orders: ${complete.toLocaleString(
          "id-ID"
        )}`}</p>
        <p className="text-sm text-yellow-500">{`Pending Orders: ${pending.toLocaleString(
          "id-ID"
        )}`}</p>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 dark:bg-black">
      <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4">
        Orders Status
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={enhancedData} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={isDark ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? "#d1d5db" : "#374151", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={(value) => {
              if (value >= 1_000_000)
                return `Rp${(value / 1_000_000).toFixed(1)}M`;
              if (value >= 1_000) return `Rp${(value / 1_000).toFixed(1)}K`;
              return `Rp${value}`;
            }}
            tick={{ fill: isDark ? "#d1d5db" : "#6b7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{
              color: isDark ? "#d1d5db" : "#374151",
              fontWeight: 600,
            }}
          />
          <Bar
            dataKey="complete"
            stackId="orders"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            name="Complete"
          />
          <Bar
            dataKey="pendingForChart"
            stackId="orders"
            fill="#facc15"
            radius={[6, 6, 0, 0]}
            name="Pending"
            minPointSize={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeadsStatusChart;
