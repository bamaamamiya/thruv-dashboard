import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const LeadsChart = ({ data }) => {
  const [barSize, setBarSize] = useState(30);
  const [chartType, setChartType] = useState("bar"); // "bar" | "line"
  const [isDark, setIsDark] = useState(false);

  // ✅ Detect dark mode (pakai data-theme="dark")
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

  useEffect(() => {
    const handleResize = () => {
      setBarSize(window.innerWidth < 768 ? 20 : 30);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const enhancedData = data.map((item) => ({
    ...item,
    total: (item.complete || 0) + (item.pending || 0),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const getValue = (key) =>
      payload.find((p) => p.dataKey === key)?.value || 0;
    const complete = getValue("complete");
    const pending = getValue("pending");
    const total = complete + pending;

    return (
      <div
        className={`px-3 py-2 rounded-md shadow-md border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-gray-100"
            : "bg-white border-gray-300 text-black"
        }`}
      >
        <p className="text-sm text-emerald-500">
          {`Complete: Rp${complete.toLocaleString("id-ID")}`}
        </p>
        <p className="text-sm text-yellow-500">
          {`Pending: Rp${pending.toLocaleString("id-ID")}`}
        </p>
        <p className="text-sm font-semibold">
          {`Total: Rp${total.toLocaleString("id-ID")}`}
        </p>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 dark:bg-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white">
          Revenue
        </h2>
        <button
          onClick={() =>
            setChartType((prev) => (prev === "bar" ? "line" : "bar"))
          }
          className="px-3 py-1 bg-black dark:bg-white dark:text-black text-white rounded-lg text-sm transition"
        >
          {chartType === "bar" ? "Line" : "Bar"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={enhancedData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="2 6"
              stroke={isDark ? "#374151" : "#e5e7eb"} // ✅ grid warna
            />
            <XAxis
              dataKey="label"
              interval={barSize === 20 ? 2 : 1}
              angle={barSize === 20 ? -15 : 0}
              textAnchor={barSize === 20 ? "end" : "middle"}
              height={barSize === 20 ? 60 : 50}
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
              tick={{
                fontSize: 12,
                fontWeight: 600,
                fill: isDark ? "#d1d5db" : "#6b7280",
              }}
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

            {chartType === "bar" && (
              <>
                <Bar
                  dataKey="complete"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={barSize}
                  name="Complete"
                />
                <Bar
                  dataKey="pending"
                  fill="#facc15"
                  radius={[6, 6, 0, 0]}
                  barSize={barSize}
                  name="Pending"
                />
              </>
            )}

            {chartType === "line" && (
              <Line
                type="monotoneX"
                dataKey="total"
                stroke="#04a7aa"
                strokeWidth={2}
                dot={false}
                name="Total Revenue"
                animationDuration={800}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadsChart;
