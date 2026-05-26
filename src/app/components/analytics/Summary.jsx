// src/app/components/analytics/Summary.jsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

const fmt = (val) => {
  if (typeof val !== "number") return "-";
  const abs = Math.abs(val);
  if (abs >= 1_000_000)
    return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)
    return `Rp ${(val / 1_000).toFixed(0)}rb`;
  return `Rp ${val}`;
};

const Summary = ({
  totalSales,
  totalPendingValue,
  totalOrders,
  completedOrders,
  pendingOrders,
  totalCost,
  totalAdSpend,
  netProfitReal,
  grossProfit,
  rtsOrders,
  start,
  end,
}) => {
  const [showDetail, setShowDetail] = useState(false);

  const netProfit = netProfitReal ?? grossProfit ?? 0;
  const margin =
    totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // health indicator
  const health =
    margin >= 20
      ? { label: "Sehat", color: "text-emerald-500", bg: "bg-emerald-500" }
      : margin >= 10
      ? { label: "Oke", color: "text-yellow-500", bg: "bg-yellow-500" }
      : { label: "Perlu Perhatian", color: "text-red-500", bg: "bg-red-500" };

  return (
    <div className="space-y-3">

      {/* DATE RANGE */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {start && end
          ? `${format(start, "dd MMM yyyy")} – ${format(end, "dd MMM yyyy")}`
          : ""}
      </p>

      {/* ── HERO CARDS ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* NET PROFIT */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-black dark:bg-gray-900 text-white shadow-lg">
          {/* background glow */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />

          <p className="text-xs text-gray-400 mb-1">Net Profit</p>
          <p
            className={`text-2xl font-bold ${
              netProfit >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {fmt(netProfit)}
          </p>

          {/* margin badge */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${health.bg}`} />
            <span className={`text-xs font-medium ${health.color}`}>
              {health.label} · {margin}% margin
            </span>
          </div>
        </div>

        {/* TOTAL ORDERS */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-black dark:bg-gray-900 text-white shadow-lg">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />

          <p className="text-xs text-gray-400 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-white">{totalOrders}</p>

          {/* order breakdown */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-emerald-400 font-medium">
              ✅ {completedOrders}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-yellow-400 font-medium">
              🕓 {pendingOrders}
            </span>
            {rtsOrders > 0 && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-xs text-red-400 font-medium">
                  🚚 {rtsOrders}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LEVEL 2 CARDS ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Revenue</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {fmt(totalSales)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Pending</p>
          <p className="text-sm font-bold text-yellow-500">
            {fmt(totalPendingValue)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Ad Spend</p>
          <p className="text-sm font-bold text-orange-500">
            {fmt(totalAdSpend)}
          </p>
        </div>
      </div>

      {/* ── LEVEL 3 COLLAPSIBLE ── */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="w-full flex items-center justify-between px-4 py-3
            text-sm font-medium text-gray-600 dark:text-gray-400
            hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <span>Detail Breakdown</span>
          {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetail && (
          <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            {[
              {
                label: "Total Revenue",
                value: fmt(totalSales),
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Product Cost",
                value: fmt(totalCost),
                color: "text-red-500",
              },
              {
                label: "Gross Profit",
                value: fmt(grossProfit),
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Ad Spend",
                value: fmt(totalAdSpend),
                color: "text-orange-500",
              },
              {
                label: "Net Profit",
                value: fmt(netProfit),
                color:
                  netProfit >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500",
              },
              {
                label: "Pending Value",
                value: fmt(totalPendingValue),
                color: "text-yellow-500",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {row.label}
                </span>
                <span className={`text-xs font-semibold ${row.color}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Summary;