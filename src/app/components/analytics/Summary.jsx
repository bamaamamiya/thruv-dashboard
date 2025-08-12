import React, { useState } from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
const Summary = ({
  totalSales,
  totalPendingValue,
  totalOrders,
  pendingOrders,
  start,
  end,
  pendingOrdersPrevious, // ✅
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const totalAll = totalSales + totalPendingValue;

  // 🧠 Persentase kenaikan
  const pendingChangePercent = pendingOrdersPrevious > 0 ? ((pendingOrders - pendingOrdersPrevious) / pendingOrdersPrevious) * 100 : 0;

  const isIncrease = pendingChangePercent >= 0;

  return (
    <div className="text-center mb-8">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl">Total Sales</h1>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Rp.{totalAll.toLocaleString()}
          </h1>

          <div className="mt-2 space-y-1 text-sm">
            <p className="text-green-600 font-semibold">
              Completed: Rp.{totalSales.toLocaleString()}
            </p>
            <p className="text-yellow-500 font-semibold">
              Pending: Rp.{totalPendingValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 📈 Persen Kenaikan */}
        <p
          className={`text-3xl font-bold ${
            pendingChangePercent === 0
              ? "text-black"
              : isIncrease
              ? "text-green-600" // karena increase pending = worse
              : "text-red-500"
          }`}
        >
          {pendingChangePercent > 0 && "↑"}
          {pendingChangePercent < 0 && "↓"}
          {Math.min(100000, Math.round(Math.abs(pendingChangePercent)))}%
        </p>
      </div>

      
      <div className="text-left">
        <p className=" text-lg mt-2">{totalOrders} Orders</p>
        <p className="text-sm text-gray-400 mt-1">
          {format(start, "dd MMM yyyy")} – {format(end, "dd MMM yyyy")}
        </p>
      </div>
    </div>
  );
};

export default Summary;
