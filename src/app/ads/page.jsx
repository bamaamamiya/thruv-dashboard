"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import dayjs from "dayjs";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import FilterBar from "@/app/components/analytics/FilterBar";
import { getDateRange, isDateInRange } from "@/utils/dateFilters";
import { useMemo } from "react"; // tambahkan import di atas
import { Timestamp } from "firebase/firestore";
export default function AdsPage() {
  const [platform, setPlatform] = useState("Facebook Ads");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [adSpend, setAdSpend] = useState("");
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [ordersCount, setOrdersCount] = useState({});
  const [grossProfitMap, setGrossProfitMap] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);

  // Dapatkan rentang tanggal dari filter bar

  const [start, end] = useMemo(
    () => getDateRange(selectedFilter, customRange),
    [selectedFilter, customRange],
  );

  // --- LISTEN FIRESTORE: adSpends + leads ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "adSpends"), async (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAds(docs);

      const counts = {};
      const gpMap = {};

      for (let ad of docs) {
        if (!ad.date) continue;
        const adDate = new Date(ad.date);
        // Filter hanya data dalam range tanggal aktif
        if (!isDateInRange(adDate, start, end)) continue;

        const startOfDay = new Date(`${ad.date}T00:00:00.000Z`);
        const endOfDay = new Date(`${ad.date}T23:59:59.999Z`);
        const q = query(
          collection(db, "leads"),
          where("createdAt", ">=", startOfDay),
          where("createdAt", "<=", endOfDay),
        );
        const snap = await getDocs(q);

        counts[ad.date] = snap.size;

        let gpTotal = 0;
        snap.forEach((doc) => {
          const lead = doc.data();
          const price = lead.price || 0;
          const cost = lead.costProduct || 0;
          gpTotal += price - cost;
        });
        gpMap[ad.date] = gpTotal;
      }
      setOrdersCount(counts);
      setGrossProfitMap(gpMap);
    });

    return () => unsub();
  }, [start, end]);

  // --- FILTER ADS BY DATE RANGE ---
  useEffect(() => {
    const filtered = ads.filter((ad) => {
      if (!ad.date) return false;
      const adDate = new Date(ad.date);
      return isDateInRange(adDate, start, end);
    });
    setFilteredAds(filtered);
  }, [ads, start, end]);

  // --- COMPUTATIONS ---
  const totalAdSpend = filteredAds.reduce(
    (sum, a) => sum + (a.adSpend || 0),
    0,
  );

  const totalOrders = filteredAds.reduce((sum, a) => {
    return sum + (ordersCount[a.date] || 0);
  }, 0);

  const avgCAC = totalOrders > 0 ? totalAdSpend / totalOrders : null;

  // --- CRUD HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adSpend) return;
    await addDoc(collection(db, "adSpends"), {
      platform,
      date,
      adSpend: Number(adSpend),
      createdAt: Timestamp.fromDate(new Date(date)),
    });
    setAdSpend("");
  };

  const handleUpdate = async (id) => {
    const ref = doc(db, "adSpends", id);
    await updateDoc(ref, { adSpend: Number(editValue) });
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = async (id) => {
    const ref = doc(db, "adSpends", id);
    await deleteDoc(ref);
  };

  // --- UI ---
  return (
    <div className="min-h-screen px-4 py-6 bg-gray-100 dark:bg-black transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* FilterBar */}
        <FilterBar
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
            Ad Spend Tracker
          </h1>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Platform"
            />
            <input
              type="number"
              value={adSpend}
              onChange={(e) => setAdSpend(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Ad Spend (Rp)"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-black dark:bg-blue-600 text-white py-2 rounded-xl w-full hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Save Entry
          </button>
        </form>

        {/* Summary */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mb-3">
            Summary
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300">
            Total Ad Spend:{" "}
            <span className="font-bold text-green-600 dark:text-green-400">
              Rp {totalAdSpend.toLocaleString()}
            </span>
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
            Total Orders:{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {totalOrders}
            </span>
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
            Average CAC:{" "}
            {avgCAC !== null ? (
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                Rp{" "}
                {avgCAC.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            ) : (
              "-"
            )}
          </p>
        </div>

        {/* Ads List */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mb-3">
            Entries
          </h2>
          <ul className="space-y-3">
            {[...filteredAds]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((ad) => {
                const orders = ordersCount[ad.date] ?? 0;
                const cac = orders > 0 ? ad.adSpend / orders : null;
                const gp = grossProfitMap[ad.date] ?? 0;
                const ltgpCac =
                  ad.adSpend > 0 && gp > 0 ? (gp / ad.adSpend).toFixed(2) : "-";

                return (
                  <li
                    key={ad.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="text-gray-800 dark:text-gray-200">
                      <div className="font-medium">
                        {ad.date} - {ad.platform}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {orders} orders
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        CAC:{" "}
                        {cac !== null ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Rp{" "}
                            {cac.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        LTGP:CAC:{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {ltgpCac}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {editingId === ad.id ? (
                        <>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border dark:border-gray-600 p-1 rounded-lg w-24 bg-gray-50 dark:bg-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => handleUpdate(ad.id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                            Rp {ad.adSpend?.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(ad.id);
                              setEditValue(ad.adSpend);
                            }}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
}
