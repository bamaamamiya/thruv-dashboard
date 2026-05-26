// src/app/components/analytics/MetaSyncButton.jsx
"use client";

import { useState } from "react";
import { useMetaSync } from "@/hooks/useMetaSync";
import dayjs from "dayjs";

export default function MetaSyncButton() {
  const { syncing, lastSync, error, syncYesterday, syncRange } = useMetaSync();
  const [showRange, setShowRange] = useState(false);
  const [since, setSince] = useState(
    dayjs().subtract(7, "day").format("YYYY-MM-DD")
  );
  const [until, setUntil] = useState(
    dayjs().subtract(1, "day").format("YYYY-MM-DD")
  );

  const handleSyncYesterday = async () => {
    const result = await syncYesterday();
    if (result?.success) {
      alert(
        `✅ Synced ${result.synced} day(s)\n` +
          result.results
            .map((r) => `${r.date}: Rp ${r.spend.toLocaleString()} (${r.action})`)
            .join("\n")
      );
    }
  };

  const handleSyncRange = async () => {
    const result = await syncRange(since, until);
    if (result?.success) {
      alert(
        `✅ Synced ${result.synced} day(s)\n` +
          result.results
            .map((r) => `${r.date}: Rp ${r.spend.toLocaleString()} (${r.action})`)
            .join("\n")
      );
    }
    setShowRange(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* MAIN SYNC BUTTONS */}
      <div className="flex gap-2">
        <button
          onClick={handleSyncYesterday}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl 
            bg-blue-600 hover:bg-blue-700 
            text-white text-sm font-medium 
            disabled:opacity-50 transition"
        >
          {syncing ? "⏳ Syncing..." : "🔄 Sync Yesterday"}
        </button>

        <button
          onClick={() => setShowRange(!showRange)}
          className="px-4 py-2 rounded-xl border border-blue-600 
            text-blue-600 dark:text-blue-400 
            text-sm font-medium hover:bg-blue-50 
            dark:hover:bg-blue-900/20 transition"
        >
          📅 Sync Range
        </button>
      </div>

      {/* RANGE PICKER */}
      {showRange && (
        <div className="flex flex-wrap gap-2 items-end p-3 
          bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="border px-2 py-1 rounded text-sm 
                dark:bg-gray-700 dark:text-white 
                dark:border-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="border px-2 py-1 rounded text-sm 
                dark:bg-gray-700 dark:text-white 
                dark:border-gray-600"
            />
          </div>

          <button
            onClick={handleSyncRange}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-blue-600 
              text-white text-sm disabled:opacity-50"
          >
            {syncing ? "⏳" : "Sync"}
          </button>
        </div>
      )}

      {/* STATUS */}
      {error && (
        <p className="text-xs text-red-500">❌ {error}</p>
      )}

      {lastSync?.success && !error && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✅ Last sync: {lastSync.synced} day(s) updated
        </p>
      )}
    </div>
  );
}