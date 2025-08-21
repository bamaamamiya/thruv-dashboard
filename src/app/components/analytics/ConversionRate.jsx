// components/ConversionRate.jsx
"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ConversionRate({
  completedOrders,
  totalOrders,
  previousRate,
}) {
  const currentRate =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const delta = previousRate !== null ? currentRate - previousRate : null;

  const getDeltaText = () => {
    if (delta === null) return "";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}% vs prev`;
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>

      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
        {currentRate.toFixed(1)}%
      </div>

      {delta !== null && (
        <div
          className={`flex items-center gap-1 text-sm mt-1 ${
            delta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {delta >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {getDeltaText()}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-300 dark:bg-gray-800 h-2 mt-3 rounded overflow-hidden">
        <div
          className="bg-green-600 dark:bg-green-500 h-2 transition-all duration-500"
          style={{ width: `${currentRate}%` }}
        />
      </div>
    </div>
  );
}
