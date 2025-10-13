import React from "react";

const AllProfitNet = ({
  totalSales,
  totalCost,
  totalPendingValue,
  totalReturnToSenderCost,
  pendingCost,
  totalAdSpend,
}) => {
  // Hitung profit bersih (semua pendapatan - semua biaya termasuk iklan)
  const profitNet =
    totalSales +
    totalPendingValue -
    totalCost -
    totalReturnToSenderCost -
    pendingCost -
    totalAdSpend;

  // Warna dinamis (merah kalau rugi)
  const profitColor =
    profitNet >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-2">Net Profit (After Ads)</h3>

      <div className={`text-3xl font-bold ${profitColor}`}>
        Rp.{profitNet.toLocaleString()}
      </div>

      <div className="text-sm mt-2 px-2 py-0.5 inline-block rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Profit Akhir Setelah Ad Spend
      </div>
    </div>
  );
};

export default AllProfitNet;
