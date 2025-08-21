import React from "react";

const Return = ({ rts }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">
        Total Return
      </h3>
      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
        Rp.{rts.toLocaleString()}
      </div>

      <div className="text-sm mt-2 px-2 py-0.5 inline-block rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
        Return Cost
      </div>
    </div>
  );
};

export default Return;
