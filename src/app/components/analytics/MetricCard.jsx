import React, { useState, useEffect } from "react";

const MetricCard = ({ label, value, prefix = "", suffix = "" }) => {
  const [isMobile, setIsMobile] = useState(false);

  // 🔹 Deteksi layar kecil
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Format angka → hapus semua, tampil apa adanya
  const formatValue = (val) => {
  if (typeof val !== "number") return "-";
  // Gunakan format ribuan Indonesia
  return `${prefix}${val.toLocaleString("id-ID")}${suffix}`;
};


  const formatted = formatValue(value);

  const lower = label.toLowerCase();
  const isExpense = lower.includes("cost");
  const isProfit =
    lower.includes("profit") ||
    lower.includes("sales") ||
    lower.includes("revenue") ||
    lower.includes("clv");
  const isPending = lower.includes("pending");
  const isRoas =
    lower.includes("roas") || lower.includes("spend") || lower.includes("ad");

  // 🔹 Warna angka sesuai konteks
  let valueColor = "text-gray-800 dark:text-gray-100";
  if (lower === "ltgptocac") valueColor = "text-white"; // ✅ tambahan ini
  else if (isExpense) valueColor = "text-red-500 dark:text-red-400";
  else if (isProfit) valueColor = "text-emerald-600 dark:text-emerald-400";
  else if (isPending) valueColor = "text-orange-500 dark:text-orange-400";
  else if (isRoas) valueColor = "text-blue-500 dark:text-blue-400";

  return (
    <div
      className="p-5 rounded-xl border border-gray-200 dark:border-gray-800
      w-full sm:w-auto
      bg-white dark:bg-[#000]
      shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]
      hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]
      transition-all duration-200"
    >
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-semibold tracking-tight ${valueColor} break-words`}
      >
        {formatted}
      </p>
    </div>
  );
};

export default MetricCard;
