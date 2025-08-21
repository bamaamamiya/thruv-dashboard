import React from "react";

const ProfitTotal = ({
  totalSales,
  totalCost,
  totalPendingValue,
  totalReturnToSenderCost,
  pendingCost,
}) => {
  // Hitung profit gabungan (sales + pending - biaya)
  const profit =
    totalSales +
    totalPendingValue -
    totalCost -
    totalReturnToSenderCost -
    pendingCost;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-2">All Profit</h3>

      {/* Angka netral (hitam / putih) */}
      <div className="text-3xl font-bold text-black dark:text-white">
        Rp.{profit.toLocaleString()}
      </div>

      {/* Badge netral */}
      <div className="text-sm mt-2 px-2 py-0.5 inline-block rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Overall (Profit + Pending)
      </div>
    </div>
  );
};

export default ProfitTotal;
