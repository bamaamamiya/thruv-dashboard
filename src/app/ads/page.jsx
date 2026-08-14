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
    <div className="min-h-screen px-4 py-6 bg-gray-100 dark:bg-black transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
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

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
            Ad Spend Tracker
          </h1>

          <MetaSyncButton />
        </div>

        {/* =====================================================
            INPUT FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* DATE */}

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
            />

            {/* PLATFORM */}

            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Platform"
            />

            {/* PRODUCT */}

            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="border dark:border-gray-700 p-2 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Product</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title || product.id}
                </option>
              ))}
            </select>

            {/* AD SPEND */}

            <input
              type="number"
              min="0"
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
            <Plus className="h-4 w-4" />
            Save Entry
          </button>
        </form>

        {/* =====================================================
            ADS ECONOMICS SUMMARY
        ===================================================== */}

        <div className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mb-4">
            Ads Economics
          </h2>

          <div className="space-y-3">
            {/* AD SPEND */}

            <p className="text-lg text-gray-700 dark:text-gray-300">
              Total Ad Spend:{" "}
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(adsEconomics.adSpend)}
              </span>
            </p>

            {/* CLICKS */}

            <p className="text-lg text-gray-700 dark:text-gray-300">
              Total Clicks:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Number(adsEconomics.clicks || 0).toLocaleString("id-ID")}
              </span>
            </p>

            {/* CPC */}

            <p className="text-lg text-gray-700 dark:text-gray-300">
              CPC:{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {adsEconomics.cpc > 0 ? formatCurrency(adsEconomics.cpc) : "-"}
              </span>
            </p>

            {/* INFO */}

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CAC, AOV, Revenue, ROAS, CVR, dan Profit akan dihitung setelah
                attribution Product → Lead → Order selesai.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ADS LIST
        ===================================================== */}

        <div className="p-5 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-2xl">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mb-3">
            Entries
          </h2>

          {filteredAds.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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

                  // Orders untuk product ini
                  const productOrders = leads.filter((lead) => {
                    if (lead.productId !== ad.productId) return false;

                    if (!lead.createdAt) return false;

                    const leadDate =
                      lead.createdAt?.toDate?.() || new Date(lead.createdAt);

                    return isDateInRange(leadDate, start, end);
                  });

                  const orders = productOrders.length;

                  // CAC
                  const cac = orders > 0 ? spend / orders : null;

                  return (
                    <li
                      key={ad.id}
                      className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      {/* =================================================
                          DATA
                      ================================================= */}

                      <div className="text-gray-800 dark:text-gray-200 space-y-1">
                        <div className="font-medium">
                          {ad.date} - {ad.platform}
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <span>Product:</span>

                          <select
                            value={ad.productId || ""}
                            onChange={(e) =>
                              handleMapProduct(ad.id, e.target.value)
                            }
                            className="border dark:border-gray-600 p-1 rounded-lg
      bg-gray-50 dark:bg-gray-600
      dark:text-white text-sm"
                          >
                            <option value="">Select Product</option>

                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.title || product.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Ad Spend:{" "}
                          <span className="font-medium">
                            {formatCurrency(spend)}
                          </span>
                        </div>

                        {/* ORDERS */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Orders:{" "}
                          <span className="font-medium">
                            {orders.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <div className="flex items-center space-x-2">
                        {editingId === ad.id ? (
                          <div className="flex items-center gap-2">
                            {/* AD SPEND */}
                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="border dark:border-gray-600 p-1 rounded-lg w-24 bg-gray-50 dark:bg-gray-600 dark:text-white"
                            />

                            {/* PRODUCT */}
                            <select
                              value={editProductId}
                              onChange={(e) => setEditProductId(e.target.value)}
                              className="border dark:border-gray-600 p-1 rounded-lg bg-gray-50 dark:bg-gray-600 dark:text-white max-w-[160px]"
                            >
                              <option value="">Select Product</option>

                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.title || product.id}
                                </option>
                              ))}
                            </select>

                            {/* SAVE */}
                            <button
                              type="button"
                              onClick={() => handleUpdate(ad.id)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                              <Save className="h-4 w-4" />
                            </button>

                            {/* CANCEL */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditValue("");
                                setEditProductId("");
                              }}
                              className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                              {formatCurrency(spend)}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(ad.id);
                                setEditValue(ad.adSpend || "");
                                setEditProductId(ad.productId || "");
                              }}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
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
          )}
        </div>
      </div>
    </div>
  );
}
