import React from "react";

const TotalAdSpend = ({ totalAdSpend }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
        Total Ad Spend
      </h3>

      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
        Rp.{totalAdSpend.toLocaleString()}
      </div>
    </div>
  );
};

export default TotalAdSpend;
