import React from "react";

const ProfitSummary = ({ totalSales, totalCost }) => {
  // Hitung profit
  const profit = totalSales - totalCost;

  // Tentukan warna berdasarkan profit (positif atau negatif)
  const isProfitPositive = profit >= 0;
  const mainColor = isProfitPositive ? "text-green-600" : "text-red-500";

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Profit</h3>
      <div className={`text-3xl font-bold ${mainColor}`}>
        Rp.{profit.toLocaleString()}
      </div>
    </div>
  );
};

export default ProfitSummary;