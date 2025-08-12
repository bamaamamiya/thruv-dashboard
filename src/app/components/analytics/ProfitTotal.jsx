import React from "react";

const ProfitTotal = ({ totalSales, totalCost , totalPendingValue}) => {
  // Hitung profit
  const profit = totalSales + totalPendingValue - totalCost;

  // Tentukan warna berdasarkan profit (positif atau negatif)
  const isProfitPositive = profit >= 0;
  const mainColor = isProfitPositive ? "text-green-600" : "text-red-500";

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">All Profit</h3>
      <div className={`text-3xl font-bold text-black`}>
        Rp.{profit.toLocaleString()}
      </div>
    </div>
  );
};

export default ProfitTotal;