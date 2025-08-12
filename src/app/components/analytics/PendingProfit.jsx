import React from "react";

const PendingProfit = ({ totalPendingValue, pendingCost }) => {
  // ✅ PERBAIKAN: Hitung profit dengan benar
  const profit = totalPendingValue - pendingCost;

  // Tentukan warna berdasarkan profit (positif atau negatif)
  // Perlu diperhatikan, nilai negatif akan menampilkan warna merah
  const isProfitPositive = profit >= 0;
  const mainColor = isProfitPositive ? "text-yellow-500" : "text-red-500";

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Pending Profit</h3>
      <div className={`text-3xl font-bold ${mainColor}`}>
        Rp.{profit.toLocaleString()}
      </div>
    </div>
  );
};

export default PendingProfit;
