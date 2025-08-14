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
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Order Status</h3>

      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-xl font-bold text-green-600">
            {completedOrders} ({completedRate.toFixed(1)}%)
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xl font-bold text-yellow-500">
            {pendingOrders} ({pendingRate.toFixed(1)}%)
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">RTS</div>
          <div className="text-xl font-bold text-red-500">
            {totalReturnToSender} ({rtsRate.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-300 h-2 mt-3 rounded relative overflow-hidden">
        <div
          className="bg-green-600 h-2 absolute left-0 top-0"
          style={{ width: `${completedRate}%` }}
        />
        <div
          className="bg-yellow-400 h-2 absolute top-0"
          style={{ left: `${completedRate}%`, width: `${pendingRate}%` }}
        />
        <div
          className="bg-red-500 h-2 absolute top-0"
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
