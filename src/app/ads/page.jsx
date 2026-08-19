"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import dayjs from "dayjs";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

import FilterBar from "@/app/components/analytics/FilterBar";
import { getDateRange, isDateInRange } from "@/utils/dateFilters";
import MetaSyncButton from "@/app/components/analytics/MetaSyncButton";
import { calculateAdEconomics } from "@/lib/economics";
import { calculateProductAttribution } from "@/lib/adsAttribution";
export default function AdsPage() {
  // =========================================================
  // STATE
  // =========================================================

  const [platform, setPlatform] = useState("Facebook Ads");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [adSpend, setAdSpend] = useState("");
  const [leads, setLeads] = useState([]);
  const [productId, setProductId] = useState("");

  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);

  const [products, setProducts] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editProductId, setEditProductId] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);
  // =========================================================
  // DATE RANGE
  // =========================================================

  const [start, end] = useMemo(
    () => getDateRange(selectedFilter, customRange),
    [selectedFilter, customRange],
  );

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  useEffect(() => {
    async function fetchProducts() {
      try {
        const snapshot = await getDocs(collection(db, "products"));

        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productData);
      } catch (error) {
        console.error("Fetch products error:", error);
      }
    }

    fetchProducts();
  }, []);

  // =========================================================
  // LISTEN leads
  // =========================================================

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "leads"),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLeads(docs);
      },
      (error) => {
        console.error("Leads listener error:", error);
      },
    );

    return () => unsub();
  }, []);

  // =========================================================
  // LISTEN ADS
  // =========================================================

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "adSpends"),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAds(docs);
      },
      (error) => {
        console.error("Ads listener error:", error);
      },
    );

    return () => unsub();
  }, []);

  // =========================================================
  // FILTER ADS BY DATE
  // =========================================================

  useEffect(() => {
    const filtered = ads.filter((ad) => {
      if (!ad.date) return false;

      const adDate = new Date(ad.date);

      return isDateInRange(adDate, start, end);
    });

    setFilteredAds(filtered);
  }, [ads, start, end]);

  // =========================================================
  // ADS ECONOMICS ENGINE
  // =========================================================

  const adsEconomics = useMemo(() => {
    const totalAdSpend = filteredAds.reduce(
      (sum, ad) => sum + (Number(ad.adSpend) || 0),
      0,
    );

    const totalClicks = filteredAds.reduce(
      (sum, ad) => sum + (Number(ad.clicks) || 0),
      0,
    );

    return calculateAdEconomics({
      adSpend: totalAdSpend,

      // Attribution belum masuk.
      // Akan diisi pada Phase 4.
      orders: 0,
      aov: 0,

      clicks: totalClicks,

      grossProfitPerUnit: 0,
    });
  }, [filteredAds]);
  // =========================================================
  // Product Attribution Engine
  // =========================================================

  const productAttribution = useMemo(() => {
    return calculateProductAttribution({
      ads: filteredAds,
      leads,
      start,
      end,
    });
  }, [filteredAds, leads, start, end]);

  // =========================================================
  // SAVE AD SPEND
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!adSpend) {
      alert("Masukkan ad spend terlebih dahulu.");
      return;
    }

    if (!productId) {
      alert("Pilih product terlebih dahulu.");
      return;
    }

    try {
      await addDoc(collection(db, "adSpends"), {
        platform,
        date,

        // Attribution key
        productId,

        // Economics
        adSpend: Number(adSpend),

        // Manual entry default
        clicks: 0,

        // Firestore timestamp
        createdAt: Timestamp.fromDate(new Date(date)),
      });

      // Reset
      setAdSpend("");
      setProductId("");
    } catch (error) {
      console.error("Save ad spend error:", error);
      alert("Gagal menyimpan ad spend.");
    }
  };

  // =========================================================
  // UPDATE AD SPEND
  // =========================================================

  const handleUpdate = async (id) => {
    const value = Number(editValue);

    if (!Number.isFinite(value) || value < 0) {
      alert("Masukkan nilai ad spend yang valid.");
      return;
    }

    if (!editProductId) {
      alert("Pilih product terlebih dahulu.");
      return;
    }

    try {
      const ref = doc(db, "adSpends", id);

      await updateDoc(ref, {
        adSpend: value,
        productId: editProductId,
      });

      setEditingId(null);
      setEditValue("");
      setEditProductId("");
    } catch (error) {
      console.error("Update ad spend error:", error);
      alert("Gagal mengupdate ad spend.");
    }
  };

  const handleMapProduct = async (adId, productId) => {
    if (!productId) return;

    try {
      await updateDoc(doc(db, "adSpends", adId), {
        productId,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Map product error:", error);
      alert("Gagal mapping product.");
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus data ad spend ini?",
    );

    if (!confirmed) return;

    try {
      const ref = doc(db, "adSpends", id);

      await deleteDoc(ref);
    } catch (error) {
      console.error("Delete ad spend error:", error);
      alert("Gagal menghapus ad spend.");
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getProductName = (productId) => {
    if (!productId) return "-";

    const product = products.find((product) => product.id === productId);

    return product?.title || productId;
  };

  const formatCurrency = (value) => {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen px-4 py-4 sm:py-6 bg-gray-100 dark:bg-black transition-colors">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* =====================================================
          FILTER
      ===================================================== */}

        <FilterBar
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />

        {/* =====================================================
          HEADER
      ===================================================== */}

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100">
              Ad Spend Tracker
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your advertising spend
            </p>
          </div>

          <div className="shrink-0">
            <MetaSyncButton />
          </div>
        </div>

        {/* =====================================================
          INPUT FORM
      ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* DATE */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border dark:border-gray-700 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* PLATFORM */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Platform
              </label>

              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="border dark:border-gray-700 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Platform"
              />
            </div>

            {/* PRODUCT */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Product
              </label>

              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="border dark:border-gray-700 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Select Product</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title || product.id}
                  </option>
                ))}
              </select>
            </div>

            {/* AD SPEND */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Ad Spend
              </label>

              <input
                type="number"
                min="0"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                className="border dark:border-gray-700 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Rp 0"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-black dark:bg-blue-600 text-white py-2.5 rounded-xl w-full hover:opacity-90 transition text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Save Entry
          </button>
        </form>

        {/* =====================================================
          ADS ECONOMICS SUMMARY
      ===================================================== */}

        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-100">
              Ads Economics
            </h2>

            <span className="text-[11px] px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {selectedFilter}
            </span>
          </div>

          {/* METRICS */}

          <div className="grid grid-cols-2 gap-3">
            {/* SPEND */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ad Spend
              </p>

              <p className="mt-1 text-sm sm:text-base font-bold text-green-600 dark:text-green-400 break-words">
                {formatCurrency(adsEconomics.adSpend)}
              </p>
            </div>

            {/* CLICKS */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">Clicks</p>

              <p className="mt-1 text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                {Number(adsEconomics.clicks || 0).toLocaleString("id-ID")}
              </p>
            </div>

            {/* CPC */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-xl col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">CPC</p>

              <p className="mt-1 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                {adsEconomics.cpc > 0 ? formatCurrency(adsEconomics.cpc) : "-"}
              </p>
            </div>
          </div>

          {/* INFO */}

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              CAC, AOV, Revenue, ROAS, CVR, dan Profit akan dihitung setelah
              attribution Product → Lead → Order selesai.
            </p>
          </div>
        </div>

        {/* =====================================================
          ADS LIST
      ===================================================== */}

        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-100">
              Entries
            </h2>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredAds.length} entries
            </span>
          </div>

          {filteredAds.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No ad spend data found.
            </div>
          ) : (
            <ul className="space-y-3">
              {[...filteredAds]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((ad) => {
                  const clicks = Number(ad.clicks || 0);
                  const spend = Number(ad.adSpend || 0);

                  const cpc = clicks > 0 ? spend / clicks : null;

                  return (
                    <li
                      key={ad.id}
                      className="p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      {/* =================================================
                        ENTRY HEADER
                    ================================================= */}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                              {ad.date}
                            </span>

                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300">
                              {ad.platform}
                            </span>
                          </div>
                        </div>

                        {/* SPEND */}
                        <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
                          {formatCurrency(spend)}
                        </span>
                      </div>

                      {/* =================================================
                        PRODUCT
                    ================================================= */}

                      <div className="mt-4">
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Product
                        </label>

                        <select
                          value={ad.productId || ""}
                          onChange={(e) =>
                            handleMapProduct(ad.id, e.target.value)
                          }
                          className="border dark:border-gray-600 p-2.5 rounded-lg
                        bg-gray-50 dark:bg-gray-600
                        dark:text-white text-sm w-full"
                        >
                          <option value="">Select Product</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.title || product.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* =================================================
                        METRICS
                    ================================================= */}

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {/* SPEND */}
                        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-600">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-300">
                            Spend
                          </p>

                          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mt-0.5">
                            {formatCurrency(spend)}
                          </p>
                        </div>

                        {/* CPC */}
                        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-600">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-300">
                            CPC
                          </p>

                          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mt-0.5">
                            {cpc ? formatCurrency(cpc) : "-"}
                          </p>
                        </div>
                      </div>

                      {/* =================================================
                        ACTIONS
                    ================================================= */}

                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        {editingId === ad.id ? (
                          <div className="w-full space-y-2">
                            {/* EDIT SPEND */}

                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="border dark:border-gray-600 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-600 dark:text-white text-sm"
                              placeholder="Ad Spend"
                            />

                            {/* EDIT PRODUCT */}

                            <select
                              value={editProductId}
                              onChange={(e) => setEditProductId(e.target.value)}
                              className="border dark:border-gray-600 p-2.5 rounded-lg w-full bg-gray-50 dark:bg-gray-600 dark:text-white text-sm"
                            >
                              <option value="">Select Product</option>

                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.title || product.id}
                                </option>
                              ))}
                            </select>

                            {/* SAVE / CANCEL */}

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdate(ad.id)}
                                className="flex items-center justify-center gap-2 p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditValue("");
                                  setEditProductId("");
                                }}
                                className="flex items-center justify-center gap-2 p-2.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(ad.id);
                                setEditValue(ad.adSpend || "");
                                setEditProductId(ad.productId || "");
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(ad.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
