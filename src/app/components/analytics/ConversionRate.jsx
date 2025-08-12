// components/ConversionRate.jsx
"use client"; // Supaya bisa pakai props yang dinamis di Client Component

export default function ConversionRate({ completedOrders, totalOrders, previousRate }) {
  const currentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const delta = previousRate !== null ? currentRate - previousRate : null;

  const getDeltaText = () => {
    if (delta === null) return "";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}% vs prev`;
  };

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
      <div className="text-3xl font-bold text-green-600">
        {currentRate.toFixed(1)}%
      </div>
      {delta !== null && (
        <div className={`text-sm mt-1 ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
          {getDeltaText()}
        </div>
      )}
      <div className="w-full bg-gray-300 h-2 mt-3 rounded">
        <div
          className="bg-green-600 h-2 rounded"
          style={{ width: `${currentRate}%` }}
        />
      </div>
    </div>
  );
}
