"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import dayjs from "dayjs";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import FilterBar from "@/app/components/analytics/FilterBar";
import { getDateRange, isDateInRange } from "@/utils/dateFilters";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CashflowPage() {
  const [type, setType] = useState("IN");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [transactions, setTransactions] = useState([]);
  const [filteredTx, setFilteredTx] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [editData, setEditData] = useState({
    amount: "",
    type: "IN",
    category: "",
    note: "",
  });

  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);

  const [start, end] = useMemo(
    () => getDateRange(selectedFilter, customRange),
    [selectedFilter, customRange],
  );

  const categories = [
    "Ads",
    "Product Cost",
    "Ongkir",
    "Fees",
    "Return",
    "Tools",
  ];

  // 🔄 FIRESTORE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
    });

    return () => unsub();
  }, []);

  // 🔎 FILTER
  useEffect(() => {
    const filtered = transactions.filter((t) => {
      if (!t.date) return false;
      return isDateInRange(new Date(t.date), start, end);
    });
    setFilteredTx(filtered);
  }, [transactions, start, end]);

  // 📊 SUMMARY
  const totalIn = filteredTx
    .filter((t) => t.type === "IN")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalOut = filteredTx
    .filter((t) => t.type === "OUT")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIn - totalOut;

  // ➕ ADD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    await addDoc(collection(db, "transactions"), {
      type,
      amount: Number(amount),
      category,
      note,
      date,
      createdAt: serverTimestamp(),
    });

    setAmount("");
    setCategory("");
    setNote("");
  };

  // ✏️ UPDATE
  const handleUpdate = async (id) => {
    const ref = doc(db, "transactions", id);

    await updateDoc(ref, {
      amount: Number(editData.amount),
      type: editData.type,
      category: editData.category,
      note: editData.note,
    });

    setEditingId(null);
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    const ref = doc(db, "transactions", id);
    await deleteDoc(ref);
  };

  const clean = (val) =>
    (val || "")
      .toString()
      .replace(/,/g, " ")
      .replace(/\r?\n|\r/g, " ")
      .trim();

  // 📤 EXPORT CSV
  const exportToCSV = () => {
    if (filteredTx.length === 0) return;

    const headers = ["Tanggal", "Type", "Category", "Amount", "Note"];

    const rows = filteredTx.map((t) => [
      t.date,
      t.type,
      clean(t.category),
      t.amount,
      clean(t.note),
    ]);

    const csv =
      "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `cashflow-${Date.now()}.csv`);
  };

  // 📤 EXPORT XLS
  const exportToXLS = () => {
    if (filteredTx.length === 0) return;

    const headers = ["Tanggal", "Type", "Category", "Amount", "Note"];

    const data = filteredTx.map((t) => [
      t.date,
      t.type,
      clean(t.category),
      t.amount,
      clean(t.note),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cashflow");

    const buffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `cashflow-${Date.now()}.xlsx`,
    );
  };

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

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
            Cashflow
          </h1>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              CSV
            </button>

            <button
              onClick={exportToXLS}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Excel
            </button>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl space-y-4"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
            />

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
          />

          <button className="bg-black text-white w-full py-2 rounded flex justify-center items-center">
            <Plus size={16} /> Save
          </button>
        </form>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow">
            <p className="text-sm text-gray-500">Total IN</p>
            <p className="text-xl font-bold text-green-500">
              Rp {totalIn.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow">
            <p className="text-sm text-gray-500">Total OUT</p>
            <p className="text-xl font-bold text-red-500">
              Rp {totalOut.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow">
            <p className="text-sm text-gray-500">Balance</p>
            <p className="text-xl font-bold text-blue-500">
              Rp {balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* LIST */}
        <div className="p-5 bg-white rounded-xl space-y-3">
          {[...filteredTx]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((t) => (
              <div key={t.id} className="flex justify-between">
                {editingId === t.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editData.amount}
                      onChange={(e) =>
                        setEditData({ ...editData, amount: e.target.value })
                      }
                      className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
                    />

                    <select
                      value={editData.type}
                      onChange={(e) =>
                        setEditData({ ...editData, type: e.target.value })
                      }
                    >
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                    </select>

                    <select
                      value={editData.category}
                      onChange={(e) =>
                        setEditData({ ...editData, category: e.target.value })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>

                    <input
                      value={editData.note}
                      onChange={(e) =>
                        setEditData({ ...editData, note: e.target.value })
                      }
                      className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
                    />

                    <button onClick={() => handleUpdate(t.id)}>
                      <Save size={16} />
                    </button>

                    <button onClick={() => setEditingId(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      {t.date} - {t.category}
                    </div>

                    <div className="flex gap-2">
                      <span>
                        {t.type === "IN" ? "+" : "-"} Rp{" "}
                        {t.amount.toLocaleString()}
                      </span>

                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditData(t);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button onClick={() => handleDelete(t.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
