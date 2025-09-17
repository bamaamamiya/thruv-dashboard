// app/heat/page.jsx
"use client";

import { useEffect, useState } from "react";
import { getHeatmapData } from "@/lib/getHeatmapData";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import dayjs from "dayjs";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Helper: tentukan minggu ke berapa dalam 1 bulan
function getWeekOfMonth(date) {
  const day = dayjs(date).date();
  if (day <= 7) return "Minggu 1";
  if (day <= 14) return "Minggu 2";
  if (day <= 21) return "Minggu 3";
  return "Minggu 4+";
}

// ----------------------------------------
// Summary Kesimpulan Per Minggu
// ----------------------------------------
function summarizeWeeklyPower(dailyWithZone) {
  const result = {};

  dailyWithZone.forEach((d) => {
    const dateObj = dayjs(d.date);
    const month = dateObj.format("MMMM YYYY");
    const week = getWeekOfMonth(d.date);

    const isStrong = d.zone === "peak power" || d.zone === "medium strong";
    if (!result[month]) result[month] = {};
    if (!result[month][week]) result[month][week] = { strong: 0, total: 0 };

    result[month][week].total += 1;
    if (isStrong) result[month][week].strong += 1;
  });

  // Konversi ke array
  const summary = [];
  Object.entries(result).forEach(([month, weeks]) => {
    Object.entries(weeks).forEach(([week, data]) => {
      const strengthRatio = data.strong / data.total;
      let label = "Lemah";
      if (strengthRatio >= 0.75) label = "⚡ Sangat Kuat";
      else if (strengthRatio >= 0.5) label = "🌿 Kuat";
      else if (strengthRatio >= 0.25) label = "🌕 Medium";
      summary.push({
        month,
        week,
        totalDays: data.total,
        strongDays: data.strong,
        label,
      });
    });
  });

  return summary.sort((a, b) => {
    const dateA = dayjs(`01 ${a.month}`, "DD MMMM YYYY").add(
      (parseInt(a.week.split(" ")[1]) - 1) * 7,
      "day"
    );
    const dateB = dayjs(`01 ${b.month}`, "DD MMMM YYYY").add(
      (parseInt(b.week.split(" ")[1]) - 1) * 7,
      "day"
    );
    return dateA - dateB;
  });
}

// ----------------------------------------
// zone utils
// ----------------------------------------
const ZONE_ORDER = ["peak power", "medium strong", "average", "lemah"];
const ZONE_LABEL = {
  "peak power": "⚡ Peak Power",
  "medium strong": "🌿 Medium Strong",
  average: "🌕 Average",
  lemah: "🔴 Lemah",
};
const ZONE_COLOR = {
  "peak power": "#047857",
  "medium strong": "#34d399",
  average: "#f59e0b",
  lemah: "#ef4444",
};

// kuantil
function quantile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const idx = (sortedArr.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  const weight = idx - lower;
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

// assign zones otomatis
function assignZonesByQuantiles(sortedDaily) {
  const counts = sortedDaily.map((d) => d.count).sort((a, b) => a - b);
  const q25 = quantile(counts, 0.25);
  const q50 = quantile(counts, 0.5);
  const q75 = quantile(counts, 0.75);

  return sortedDaily.map((d) => {
    const c = d.count;
    let zone = "lemah";
    if (c >= q75) zone = "peak power";
    else if (c >= q50) zone = "medium strong";
    else if (c >= q25) zone = "average";
    else zone = "lemah";
    return { ...d, zone };
  });
}

// group consecutive dates by zone
function groupConsecutiveByZone(dailyWithZone) {
  const groups = [];
  let cur = null;

  for (const item of dailyWithZone) {
    if (!cur) {
      cur = {
        zone: item.zone,
        start: item.date,
        end: item.date,
        total: item.count,
        days: 1,
      };
      continue;
    }
    const prevEnd = dayjs(cur.end);
    const currDate = dayjs(item.date);
    const isConsecutive = currDate.diff(prevEnd, "day") === 1;

    if (isConsecutive && item.zone === cur.zone) {
      cur.end = item.date;
      cur.total += item.count;
      cur.days += 1;
    } else {
      groups.push(cur);
      cur = {
        zone: item.zone,
        start: item.date,
        end: item.date,
        total: item.count,
        days: 1,
      };
    }
  }

  if (cur) groups.push(cur);
  return groups;
}

// summary tanggal per zone
function summarizeDaysByZone(dailyWithZone) {
  const result = {};
  for (const d of dailyWithZone) {
    if (!result[d.zone]) result[d.zone] = [];
    result[d.zone].push(d.date);
  }
  Object.keys(result).forEach((z) =>
    result[z].sort((a, b) => new Date(a) - new Date(b))
  );
  return result;
}

// monthly behavior
function summarizeMonthlyBehavior(dailyWithZone) {
  const grouped = {};
  dailyWithZone.forEach((d) => {
    const month = dayjs(d.date).format("MMMM YYYY");
    if (!grouped[month]) grouped[month] = { high: [], low: [] };
    const dayLabel = dayjs(d.date).format("DD MMM");
    if (d.zone === "peak power" || d.zone === "medium strong")
      grouped[month].high.push(dayLabel);
    else grouped[month].low.push(dayLabel);
  });

  const formatRanges = (days) => {
    const sorted = days.map((d) => dayjs(d, "DD MMM")).sort((a, b) => a - b);
    const ranges = [];
    let start = null;
    let prev = null;

    sorted.forEach((d) => {
      if (!start) {
        start = d;
        prev = d;
        return;
      }
      if (d.diff(prev, "day") === 1) prev = d;
      else {
        ranges.push([start, prev]);
        start = d;
        prev = d;
      }
    });
    if (start) ranges.push([start, prev]);
    return ranges.map(([s, e]) =>
      s.isSame(e, "day")
        ? s.format("DD MMM")
        : `${s.format("DD")}–${e.format("DD MMM")}`
    );
  };

  return Object.entries(grouped).map(([month, { high, low }]) => ({
    month,
    high: formatRanges(high),
    low: formatRanges(low),
  }));
}

// format range
function formatRange(start, end) {
  const s = dayjs(start);
  const e = dayjs(end);
  if (s.isSame(e, "day")) return s.format("DD MMM YYYY");
  if (s.isSame(e, "month") && s.isSame(e, "year"))
    return `${s.format("DD")}–${e.format("DD MMM YYYY")}`;
  return `${s.format("DD MMM YYYY")} — ${e.format("DD MMM YYYY")}`;
}

// ---------------- Main Component ----------------
export default function HeatPage() {
  const [data, setData] = useState([]);
  const [dailyWithZone, setDailyWithZone] = useState([]);
  const [groupsByZone, setGroupsByZone] = useState([]);
  const [summaryChartData, setSummaryChartData] = useState([]);
  const [daysByZone, setDaysByZone] = useState({});
  const [monthlyBehavior, setMonthlyBehavior] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);

  useEffect(() => {
    getHeatmapData().then((raw) => {
      const sorted = (raw || [])
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const withZones = assignZonesByQuantiles(sorted);
      setDailyWithZone(withZones);

      // assign juga ke data untuk heatmap
      setData(withZones.map((d) => ({ date: d.date, count: d.count })));

      setGroupsByZone(groupConsecutiveByZone(withZones));
      setMonthlyBehavior(summarizeMonthlyBehavior(withZones));
      setDaysByZone(summarizeDaysByZone(withZones));
      setWeeklySummary(summarizeWeeklyPower(withZones));

      const summary = withZones.reduce((acc, d) => {
        acc[d.zone] = (acc[d.zone] || 0) + d.count;
        return acc;
      }, {});
      setSummaryChartData(
        ZONE_ORDER.map((z) => ({
          name: z,
          total: summary[z] || 0,
          color: ZONE_COLOR[z],
        }))
      );
    });
  }, []);

  const today = dayjs().format("YYYY-MM-DD");
  const startDate = dayjs().subtract(3, "month").format("YYYY-MM-DD");

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold mb-6">
        🔥 Purchasing Power Ranges (data-driven)
      </h1>

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">📅 Heatmap 3 Bulan</h2>
        <CalendarHeatmap
          startDate={startDate}
          endDate={today}
          values={data}
          classForValue={(value) => {
            if (!value) return "color-empty";
            if (value.count >= 20) return "color-scale-4";
            if (value.count >= 10) return "color-scale-3";
            if (value.count >= 5) return "color-scale-2";
            return "color-scale-1";
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) return null;
            const formatted = dayjs(value.date).format("DD MMM");
            return {
              "data-tooltip-id": "heatmap-tooltip",
              "data-tooltip-content": `${formatted}: ${value.count} order`,
            };
          }}
          showWeekdayLabels
        />
        <ReactTooltip id="heatmap-tooltip" place="top" />
      </div>

      {/* Chart + Weekly Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">⚡ Aggregate by Zone</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickFormatter={(n) => ZONE_LABEL[n] || n}
                />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                >
                  {summaryChartData.map((entry, idx) => (
                    <cell key={`c-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">
            📌 Weekly Strength Summary
          </h3>
          <div className="space-y-2 text-sm">
            {weeklySummary.map((w, i) => (
              <div key={i}>
                <span className="font-semibold">
                  {w.month} - {w.week}:
                </span>{" "}
                <span>
                  {w.label} ({w.strongDays}/{w.totalDays} hari kuat)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Behavior */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 m-2 shadow">
        <h3 className="text-lg font-semibold mb-4">
          📊 Monthly Behavior Pattern
        </h3>
        <div className="space-y-4">
          {monthlyBehavior.map((m, idx) => (
            <div key={idx} className="border-b border-gray-600 pb-3">
              <h4 className="font-semibold">{m.month}</h4>
              <p className="text-sm mt-1">
                <span className="text-green-500 font-medium">High:</span>{" "}
                {m.high.length ? m.high.join(", ") : "–"}
              </p>
              <p className="text-sm">
                <span className="text-red-500 font-medium">Low:</span>{" "}
                {m.low.length ? m.low.join(", ") : "–"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail per Zone */}
      <div className="grid md:grid-cols-2 gap-6">
        {ZONE_ORDER.map((zone) => {
          const groups = groupsByZone.filter((g) => g.zone === zone);
          const totalForZone =
            summaryChartData.find((s) => s.name === zone)?.total || 0;
          return (
            <div
              key={zone}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{ZONE_LABEL[zone]}</h4>
                  <p className="text-xs text-gray-500">
                    Range (from actual dates)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Orders</div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: ZONE_COLOR[zone] }}
                  >
                    {totalForZone}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {groups.length === 0 ? (
                  <div className="text-gray-500">No dates in this zone</div>
                ) : (
                  groups.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <div className="font-medium">
                          {formatRange(g.start, g.end)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Days: {g.days}
                        </div>
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: ZONE_COLOR[zone] }}
                      >
                        {g.total} orders
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
