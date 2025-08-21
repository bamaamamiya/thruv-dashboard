import React from "react";

const ProfitSummary = ({ totalSales, totalCost, totalReturnToSenderCost }) => {
  // Hitung profit
  const profit = totalSales - totalCost - totalReturnToSenderCost;

  // Tentukan warna berdasarkan profit
  const isProfitPositive = profit >= 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Profit</h3>

      <div
        className={`text-3xl font-bold ${
          isProfitPositive
            ? "text-green-600 dark:text-green-400"
            : "text-red-500 dark:text-red-400"
        }`}
      >
        Rp.{profit.toLocaleString()}
      </div>

      <div
        className={`text-sm mt-2 px-2 py-0.5 inline-block rounded ${
          isProfitPositive
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}
      >
        {isProfitPositive ? "Profit" : "Loss"}
      </div>
    </div>
  );
};

export default ProfitSummary;
