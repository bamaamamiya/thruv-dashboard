import React from "react";

const PendingProfit = ({ totalPendingValue, pendingCost }) => {
  const profit = totalPendingValue - pendingCost;
  const isProfitPositive = profit >= 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
        Pending Profit
      </h3>

      <div
        className={`text-3xl font-bold ${
          isProfitPositive
            ? "text-yellow-500 dark:text-yellow-400"
            : "text-red-500 dark:text-red-400"
        }`}
      >
        Rp.{profit.toLocaleString()}
      </div>

      <div
        className={`text-sm mt-2 px-2 py-0.5 inline-block rounded ${
          isProfitPositive
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}
      >
        {isProfitPositive ? "Potential Profit" : "Potential Loss"}
      </div>
    </div>
  );
};

export default PendingProfit;
