// src/hooks/useMetaSync.js
import { useState } from "react";
import dayjs from "dayjs";

export function useMetaSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // sync kemarin saja
  const syncYesterday = async () => {
    setSyncing(true);
    setError(null);

    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    try {
      const res = await fetch("/api/sync-meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since: yesterday, until: yesterday }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setLastSync({ date: yesterday, ...data });
      }

      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // sync range custom
  const syncRange = async (since, until) => {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/sync-meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since, until }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setLastSync({ since, until, ...data });
      }

      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return { syncing, lastSync, error, syncYesterday, syncRange };
}