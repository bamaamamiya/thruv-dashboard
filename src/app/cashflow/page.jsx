// src/app/cashflow/page.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import FilterBar from "@/app/components/analytics/FilterBar";
import { getDateRange, isDateInRange } from "@/utils/dateFilters";

// ─── HELPERS ───────────────────────────────────────
const fmt = (val) => {
  const abs = Math.abs(val || 0);
  if (abs >= 1_000_000)
    return `Rp ${((val || 0) / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)
    return `Rp ${((val || 0) / 1_000).toFixed(0)}rb`;
  return `Rp ${val || 0}`;
};

const fmtFull = (val) =>
  `Rp ${Math.abs(val || 0).toLocaleString("id-ID")}`;

const getCreatedAt = (item) => {
  if (!item.createdAt) return null;
  if (item.createdAt.toDate) return item.createdAt.toDate();
  if (item.createdAt.seconds)
    return new Date(item.createdAt.seconds * 1000);
  return new Date(item.createdAt);
};

// ─── MAIN PAGE ─────────────────────────────────────
export default function CashflowPage() {
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);

  // data sources
  const [leads, setLeads] = useState([]);
  const [adSpends, setAdSpends] = useState([]);
  const [manualTx, setManualTx] = useState([]);

  // form state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [txDate, setTxDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [txType, setTxType] = useState("OUT");

  const [start, end] = useMemo(
    () => getDateRange(selectedFilter, customRange),
    [selectedFilter, customRange]
  );

  // ─── FETCH LEADS ─────────────────────────────────
  useEffect(() => {
    if (!start || !end) return;

    const fetchLeads = async () => {
      const q = query(
        collection(db, "leads"),
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end))
      );
      const snap = await getDocs(q);
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchLeads();
  }, [start, end]);

  // ─── LISTEN AD SPENDS ────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "adSpends"), (snap) => {
      setAdSpends(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ─── LISTEN MANUAL TX ────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transactions"), (snap) => {
      setManualTx(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ─── FILTERED DATA ───────────────────────────────
  const filteredAds = useMemo(
    () =>
      adSpends.filter((a) => {
        if (!a.date) return false;
        return isDateInRange(new Date(a.date), start, end);
      }),
    [adSpends, start, end]
  );

  const filteredManual = useMemo(
    () =>
      manualTx.filter((t) => {
        if (!t.date) return false;
        return isDateInRange(new Date(t.date), start, end);
      }),
    [manualTx, start, end]
  );

  // ─── BUILD CASHFLOW ITEMS ────────────────────────
  const cashflowItems = useMemo(() => {
    const items = [];

    // 1. Revenue dari complete orders (IN)
    leads
      .filter((l) => l.status === "complete")
      .forEach((l) => {
        const date = getCreatedAt(l);
        items.push({
          id: `revenue-${l.id}`,
          type: "IN",
          category: "Revenue",
          label: l.productTitle || "Order",
          amount: Number(l.price || 0),
          date,
          source: "auto",
          icon: "💰",
        });
      });

    // 2. Product cost keluar (OUT)
    leads
      .filter((l) => l.status === "complete")
      .forEach((l) => {
        const date = getCreatedAt(l);
        items.push({
          id: `cost-${l.id}`,
          type: "OUT",
          category: "Product Cost",
          label: l.productTitle || "Product Cost",
          amount: Number(l.costProduct || 0),
          date,
          source: "auto",
          icon: "📦",
        });
      });

    // 3. RTS cost (OUT)
    leads
      .filter((l) => l.status === "rts" && l.rts > 0)
      .forEach((l) => {
        const date = getCreatedAt(l);
        items.push({
          id: `rts-${l.id}`,
          type: "OUT",
          category: "RTS Cost",
          label: `Return - ${l.name || ""}`,
          amount: Number(l.rts || 0),
          date,
          source: "auto",
          icon: "🚚",
        });
      });

    // 4. Ads spend (OUT)
    filteredAds.forEach((a) => {
      items.push({
        id: `ads-${a.id}`,
        type: "OUT",
        category: "Ads Spend",
        label: a.platform || "Meta Ads",
        amount: Number(a.adSpend || 0),
        date: new Date(a.date),
        source: "auto",
        icon: "📣",
      });
    });

    // 5. Manual transactions
    filteredManual.forEach((t) => {
      items.push({
        id: `manual-${t.id}`,
        type: t.type,
        category: t.category || "Manual",
        label: t.note || t.category || "-",
        amount: Number(t.amount || 0),
        date: new Date(t.date),
        source: "manual",
        icon: t.type === "IN" ? "➕" : "➖",
        docId: t.id,
      });
    });

    // sort by date descending
    return items.sort((a, b) => (b.date || 0) - (a.date || 0));
  }, [leads, filteredAds, filteredManual]);

  // ─── SUMMARY ─────────────────────────────────────
  const summary = useMemo(() => {
    const totalIn = cashflowItems
      .filter((i) => i.type === "IN")
      .reduce((s, i) => s + i.amount, 0);

    const totalOut = cashflowItems
      .filter((i) => i.type === "OUT")
      .reduce((s, i) => s + i.amount, 0);

    // breakdown OUT
    const revenue = cashflowItems
      .filter((i) => i.category === "Revenue")
      .reduce((s, i) => s + i.amount, 0);

    const productCost = cashflowItems
      .filter((i) => i.category === "Product Cost")
      .reduce((s, i) => s + i.amount, 0);

    const adsCost = cashflowItems
      .filter((i) => i.category === "Ads Spend")
      .reduce((s, i) => s + i.amount, 0);

    const rtsCost = cashflowItems
      .filter((i) => i.category === "RTS Cost")
      .reduce((s, i) => s + i.amount, 0);

    const manualOut = cashflowItems
      .filter((i) => i.category !== "Revenue" && i.type === "OUT" && i.source === "manual")
      .reduce((s, i) => s + i.amount, 0);

    return {
      totalIn,
      totalOut,
      netCash: totalIn - totalOut,
      revenue,
      productCost,
      adsCost,
      rtsCost,
      manualOut,
    };
  }, [cashflowItems]);

  // ─── ADD MANUAL TX ───────────────────────────────
  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!amount) return;

    await addDoc(collection(db, "transactions"), {
      type: txType,
      amount: Number(amount),
      category: txType === "IN" ? "Manual IN" : "Ops",
      note,
      date: txDate,
      createdAt: serverTimestamp(),
    });

    setAmount("");
    setNote("");
  };

  // ─── DELETE MANUAL TX ────────────────────────────
  const handleDelete = async (docId) => {
    if (!docId) return;
    await deleteDoc(doc(db, "transactions", docId));
  };

  // ─── CATEGORY COLOR ──────────────────────────────
  const categoryColor = {
    Revenue: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Product Cost": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Ads Spend": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "RTS Cost": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "Manual IN": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Ops: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    Manual: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  // ─── RENDER ──────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-6 bg-gray-100 dark:bg-black">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* FILTER */}
        <FilterBar
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />

        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          Cashflow
        </h1>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Total IN</p>
            <p className="text-lg font-bold text-emerald-500">
              {fmt(summary.totalIn)}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Total OUT</p>
            <p className="text-lg font-bold text-red-500">
              {fmt(summary.totalOut)}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Net Cash</p>
            <p
              className={`text-lg font-bold ${
                summary.netCash >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {fmt(summary.netCash)}
            </p>
          </div>
        </div>

        {/* BREAKDOWN */}
        <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Breakdown
          </p>

          <div className="space-y-2">
            {[
              { label: "💰 Revenue", value: summary.revenue, positive: true },
              { label: "📦 Product Cost", value: summary.productCost, positive: false },
              { label: "📣 Ads Spend", value: summary.adsCost, positive: false },
              { label: "🚚 RTS Cost", value: summary.rtsCost, positive: false },
              { label: "➖ Ops & Admin", value: summary.manualOut, positive: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {row.label}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    row.positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {row.positive ? "+" : "-"} {fmtFull(row.value)}
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-white">
                Net Cash
              </span>
              <span
                className={`text-sm font-bold ${
                  summary.netCash >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {fmtFull(summary.netCash)}
              </span>
            </div>
          </div>
        </div>

        {/* ADD MANUAL TRANSACTION */}
        <form
          onSubmit={handleAddManual}
          className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            + Add Manual Transaction
          </p>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-800 dark:text-white col-span-2"
            />

            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-800 dark:text-white"
            >
              <option value="OUT">OUT (Keluar)</option>
              <option value="IN">IN (Masuk)</option>
            </select>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (Rp)"
              className="border dark:border-gray-700 p-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-800 dark:text-white"
            />

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (biaya admin, transfer, dll)"
              className="border dark:border-gray-700 p-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-800 dark:text-white col-span-2"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2
              bg-black dark:bg-gray-700 text-white py-2 rounded-xl text-sm"
          >
            <Plus size={16} /> Save
          </button>
        </form>

        {/* CASHFLOW JOURNEY */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Cashflow Journey
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {cashflowItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                No data for this period
              </p>
            )}

            {cashflowItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                        {item.label}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          categoryColor[item.category] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.source === "auto" && (
                        <span className="text-xs text-gray-400">auto</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.date
                        ? dayjs(item.date).format("DD MMM YYYY")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      item.type === "IN"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {item.type === "IN" ? "+" : "-"} {fmtFull(item.amount)}
                  </span>

                  {/* hanya manual yang bisa dihapus */}
                  {item.source === "manual" && (
                    <button
                      onClick={() => handleDelete(item.docId)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}