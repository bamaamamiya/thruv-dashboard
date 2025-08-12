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
      <div className="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-md text-bold">
        <p className="text-sm text-emerald-600">
          {`Complete: Rp${complete.toLocaleString("id-ID")}`}
        </p>
        <p className="text-sm text-yellow-600">
          {`Pending: Rp${pending.toLocaleString("id-ID")}`}
        </p>
        <p className="text-sm text-black">
          {`Total: Rp${total.toLocaleString("id-ID")}`}
        </p>
      </div>
    );
  };

  return (
    <div className=" p-4 md:p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg font-bold text-gray-800">
          Revenue
        </h2>
        <button
          onClick={() =>
            setChartType((prev) => (prev === "bar" ? "line" : "bar"))
          }
          className="px-3 py-1 bg-black text-white rounded-lg text-sm  transition"
        >
          {chartType === "bar" ? "Line" : "Bar"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={enhancedData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="2 6" />
            <XAxis
              dataKey="label"
              interval={barSize === 20 ? 2 : 1}
              angle={barSize === 20 ? -15 : 0}
              textAnchor={barSize === 20 ? "end" : "middle"}
              height={barSize === 20 ? 60 : 50}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={(value) => {
                if (value >= 1_000_000)
                  return `Rp${(value / 1_000_000).toFixed(1)}M`;
                if (value >= 1_000) return `Rp${(value / 1_000).toFixed(1)}K`;
                return `Rp${value}`;
              }}
              tick={{ fontSize: 12, fontWeight: 600, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />

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
