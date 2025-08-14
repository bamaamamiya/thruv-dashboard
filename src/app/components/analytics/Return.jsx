import React from "react";

const Return = ({ rts }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Total Return</h3>
      <div className={`text-3xl font-bold text-red-600`}>Rp.{rts.toLocaleString()}</div>
    </div>
  );
};

export default Return;
