"use client";
import React, { useEffect, useState, useMemo } from "react";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FilterBar from "@/app/components/analytics/FilterBar";
import LeadsChart from "@/app/components/analytics/LeadsChart";
import MetricCard from "@/app/components/analytics/MetricCard";
import LeadsStatusChart from "./components/analytics/LeadsStatusChart";
import { Timestamp } from "firebase/firestore";
import { getDateRange } from "@/utils/dateFilters";
import {
  calculateSummary,
  generateChartData,
  calculateTotalAdSpend,
} from "@/utils/processLeads";
import Summary from "./components/analytics/Summary";
import { calculateProductAttribution } from "@/lib/adsAttribution";
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("profit");

  // 🔹 Redirect kalau belum login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 🔹 Date filters
  const [start, end] = useMemo(() => {
    return getDateRange(selectedFilter, customRange);
  }, [selectedFilter, customRange]);
  const filteredLeads = leads;
  const filteredAds = ads;
  const previousSummary = {};
  // 🔹 Summaries
  const totalAdSpend = useMemo(() => {
    return calculateTotalAdSpend(filteredAds);
  }, [filteredAds]);
  const uniqueCustomers = useMemo(() => {
    return new Set(filteredLeads.map((l) => l.phone || l.email)).size;
  }, [filteredLeads]);

  // ❗ kirim SEMUA leads (bukan confirmed doang)

  const summary = useMemo(() => {
    return calculateSummary(filteredLeads, totalAdSpend, uniqueCustomers, 0);
  }, [filteredLeads, totalAdSpend, uniqueCustomers]);

  const chartData = useMemo(() => {
    return generateChartData(filteredLeads, selectedFilter, start, end);
  }, [filteredLeads, selectedFilter, start, end]);
  const roas =
    totalAdSpend > 0
      ? Number((summary.totalSales / totalAdSpend).toFixed(2))
      : 0;

  const productEconomics = useMemo(() => {
    return calculateProductAttribution({
      ads,
      leads,
      start,
      end,
    });
  }, [ads, leads, start, end]);

  // 🔹 Listen to Firestore (jalankan setelah login)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setFetching(true);

        // 🔥 Query leads by date
        const leadsQuery = query(
          collection(db, "leads"),
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end)),
        );

        // 🔥 Query ads by date
        const adsQuery = query(
          collection(db, "adSpends"),
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end)),
        );

        const [leadsSnapshot, adsSnapshot] = await Promise.all([
          getDocs(leadsQuery),
          getDocs(adsQuery),
        ]);

        setLeads(
          leadsSnapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );

        setAds(
          adsSnapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [user, selectedFilter, customRange]);

  if (fetching)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading dashboard...
      </div>
    );

  // 🔹 Loading & redirect states
  if (loading)
    return (
      <div className="text-center flex justify-center items-center">
        <p>Welcome Back,BAMA...</p>
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <FilterBar
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />

        {/* Summary Cards */}
        <Summary
          totalSales={summary.totalSales}
          totalOrders={summary.totalOrders}
          completedOrders={summary.completedOrders}
          pendingOrders={summary.pendingOrders}
          totalPendingValue={summary.totalPendingValue}
          totalCost={summary.totalCost}
          totalAdSpend={totalAdSpend} // ← tambah
          netProfitReal={summary.netProfitReal} // ← tambah
          grossProfit={summary.grossProfit} // ← tambah
          rtsOrders={summary.rtsOrders} // ← tambah
          start={start}
          end={end}
        />

       

        {/* Chart Section */}
        <div className="mt-10 space-y-4">
          <LeadsChart data={chartData} />
          <LeadsStatusChart data={chartData} />
        </div>

        {/* Metrics Grid */}
        {/* ── METRIC TABS ── */}
        <div className="space-y-4 mt-6">
          {/* TAB BUTTONS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: "profit", label: "💰 Profit" },
              { key: "ads", label: "📣 Ads" },
              { key: "orders", label: "📦 Orders" },
              { key: "cost", label: "🏭 Cost" },
              { key: "ratios", label: "📈 Ratios" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition
          ${
            activeTab === tab.key
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 💰 PROFIT TAB */}
            {activeTab === "profit" && (
              <>
                <MetricCard
                  label="Total Sales"
                  value={summary.totalSales}
                  prefix="Rp"
                />
                <MetricCard
                  label="Gross Profit"
                  value={summary.grossProfit}
                  prefix="Rp"
                />
                <MetricCard
                  label="Net Profit (Real)"
                  value={summary.netProfitReal}
                  prefix="Rp"
                />
                <MetricCard
                  label="Net Profit (Projected)"
                  value={summary.netProfitProjected}
                  prefix="Rp"
                />
                <MetricCard
                  label="Profit Margin"
                  value={summary.profitMargin}
                  suffix="%"
                />
                <MetricCard
                  label="Gross Margin"
                  value={summary.grossMargin}
                  suffix="%"
                />
              </>
            )}

            {/* 📣 ADS TAB */}
            {activeTab === "ads" && (
              <>
                <MetricCard
                  label="Total Ad Spend"
                  value={totalAdSpend}
                  prefix="Rp"
                />
                <MetricCard label="CAC" value={summary.cac} prefix="Rp" />
                <MetricCard label="ROAS" value={roas} suffix="x" />
                <MetricCard
                  label="LTGP : CAC"
                  value={summary.ltgpToCac}
                  suffix="x"
                />
              </>
            )}

            {/* 📦 ORDERS TAB */}
            {activeTab === "orders" && (
              <>
                <MetricCard label="Total Orders" value={summary.totalOrders} />
                <MetricCard
                  label="Complete Orders"
                  value={summary.completedOrders}
                />
                <MetricCard
                  label="Pending Orders"
                  value={summary.pendingOrders}
                />
                <MetricCard
                  label="Pending Value"
                  value={summary.totalPendingValue}
                  prefix="Rp"
                />
                <MetricCard
                  label="Pending Profit"
                  value={summary.pendingProfit}
                  prefix="Rp"
                />
                <MetricCard
                  label="Avg Order Value"
                  value={summary.avgOrderValue}
                  prefix="Rp"
                />
              </>
            )}

            {/* 🏭 COST TAB */}
            {activeTab === "cost" && (
              <>
                <MetricCard
                  label="Total Product Cost"
                  value={summary.totalCost}
                  prefix="Rp"
                />
                <MetricCard
                  label="Pending Product Cost"
                  value={summary.pendingCost}
                  prefix="Rp"
                />
                <MetricCard
                  label="Return Cost (RTS)"
                  value={summary.totalReturnToSenderCost}
                  prefix="Rp"
                />
                <MetricCard
                  label="Total RTS Orders"
                  value={summary.rtsOrders}
                />
                <MetricCard
                  label="RTS Percentage"
                  value={summary.rtsPercentage}
                  suffix="%"
                />
              </>
            )}

            {/* 📈 RATIOS TAB */}
            {activeTab === "ratios" && (
              <>
                <MetricCard
                  label="Conversion Rate"
                  value={summary.conversionRate}
                  suffix="%"
                />
                <MetricCard label="ROAS" value={roas} suffix="x" />
                <MetricCard
                  label="LTGP : CAC"
                  value={summary.ltgpToCac}
                  suffix="x"
                />
                <MetricCard
                  label="Gross Margin"
                  value={summary.grossMargin}
                  suffix="%"
                />
                <MetricCard
                  label="Profit Margin"
                  value={summary.profitMargin}
                  suffix="%"
                />
                <MetricCard
                  label="RTS Percentage"
                  value={summary.rtsPercentage}
                  suffix="%"
                />
              </>
            )}
          </div>

					 <div className="space-y-4">
          <h2 className="text-xl font-bold">Product Economics</h2>

          <div className="space-y-3">
            {productEconomics.map((item) => (
              <div
                key={item.productId}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{item.productId}</h3>

                    <p className="text-sm text-gray-500">
                      {item.orders} orders
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">CAC</p>

                    <p className="text-xl font-bold">
                      {item.cac !== null
                        ? `Rp ${Math.round(item.cac).toLocaleString("id-ID")}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Ad Spend</p>
                    <p className="font-semibold">
                      Rp {Math.round(item.adSpend).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-semibold">{item.orders}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="font-semibold">
                      Rp {Math.round(item.revenue).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">AOV</p>
                    <p className="font-semibold">
                      Rp {Math.round(item.aov).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">CAC</p>
                    <p className="font-semibold">
                      {item.cac !== null
                        ? `Rp ${Math.round(item.cac).toLocaleString("id-ID")}`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Gross Profit</p>
                    <p className="font-semibold">
                      Rp {Math.round(item.grossProfit).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">GP / Order</p>
                    <p className="font-semibold">
                      Rp{" "}
                      {Math.round(item.grossProfitPerOrder).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">LTGP : CAC</p>
                    <p className="font-semibold">
                      {item.ltgpToCac !== null
                        ? `${item.ltgpToCac.toFixed(2)}x`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">After Ads</p>
                    <p className="font-semibold">
                      Rp{" "}
                      {Math.round(item.contributionAfterAds).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
