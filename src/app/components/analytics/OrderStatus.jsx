import React from "react";

const OrderStatus = ({
  completedOrders,
  pendingOrders,
  totalOrders,
  totalReturnToSender,
}) => {
  const completedRate =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const pendingRate =
    totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0;
  const rtsRate =
    totalOrders > 0 ? (totalReturnToSender / totalOrders) * 100 : 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-3">Order Status</h3>

      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {completedOrders} ({completedRate.toFixed(1)}%)
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          <div className="text-xl font-bold text-yellow-500 dark:text-yellow-400">
            {pendingOrders} ({pendingRate.toFixed(1)}%)
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">RTS</div>
          <div className="text-xl font-bold text-red-500 dark:text-red-400">
            {totalReturnToSender} ({rtsRate.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 mt-3 rounded relative overflow-hidden bg-gray-300 dark:bg-gray-800">
        <div
          className="bg-green-600 dark:bg-green-500 h-2 absolute left-0 top-0 transition-all duration-500"
          style={{ width: `${completedRate}%` }}
        />
        <div
          className="bg-yellow-400 dark:bg-yellow-300 h-2 absolute top-0 transition-all duration-500"
          style={{ left: `${completedRate}%`, width: `${pendingRate}%` }}
        />
        <div
          className="bg-red-500 dark:bg-red-400 h-2 absolute top-0 transition-all duration-500"
          style={{
            left: `${completedRate + pendingRate}%`,
            width: `${rtsRate}%`,
          }}
        />
      </div>
    </div>
  );
};

export default OrderStatus;
