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
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);
  const [fetching, setFetching] = useState(true);
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

  // 🔹 Metric list
  const metricGroups = useMemo(() => {
    return [
      {
        title: "📊 Sales & Profit",
        items: [
          { label: "Total Sales", value: summary.totalSales, prefix: "Rp" },
          { label: "Gross Profit", value: summary.grossProfit, prefix: "Rp" },
          {
            label: "Net Profit (Real)",
            value: summary.netProfitReal,
            prefix: "Rp",
          },
          {
            label: "Net Profit (Projected)",
            value: summary.netProfitProjected,
            prefix: "Rp",
          },
          { label: "Profit Margin", value: summary.profitMargin, suffix: "%" },
          {
            label: "Number of Orders (Complete)",
            value: summary.completedOrders,
          },
          { label: "Number of Orders (Pending)", value: summary.pendingOrders },
        ],
      },
      {
        title: "💸 Ad Performance",
        items: [
          { label: "Total Ad Spend", value: totalAdSpend, prefix: "Rp" },
          { label: "CAC", value: summary.cac, prefix: "Rp" },
          { label: "ROAS", value: roas, suffix: "x" },
        ],
      },
      {
        title: "🧾 Orders & Pending",
        items: [
          {
            label: "Pending Value",
            value: summary.totalPendingValue,
            prefix: "Rp",
          },
          {
            label: "Pending Profit",
            value: summary.pendingProfit,
            prefix: "Rp",
          },
        ],
      },
      {
        title: "🏭 Cost & Return",
        items: [
          {
            label: "Total Product Cost",
            value: summary.totalCost,
            prefix: "Rp",
          },
          {
            label: "Total Product Pending Cost",
            value: summary.pendingCost,
            prefix: "Rp",
          },
          {
            label: "Return Cost (RTS)",
            value: summary.totalReturnToSenderCost,
            prefix: "Rp",
          },
          { label: "Total RTS Orders", value: summary.rtsOrders },
          {
            label: "RTS Percentage",
            value: summary.rtsPercentage,
            suffix: "%",
          },
        ],
      },
      {
        title: "📈 Ratios & Metrics",
        items: [
          { label: "LTGP : CAC", value: summary.ltgpToCac, suffix: "x" },
          {
            label: "Conversion Rate",
            value: summary.conversionRate,
            suffix: "%",
          },
        ],
      },
    ];
  }, [summary, totalAdSpend, roas]);

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


	console.log("ADS:", ads);
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
          start={start}
          end={end}
          pendingOrdersPrevious={previousSummary?.pendingOrders || 0}
        />

        {/* Chart Section */}
        <div className="mt-10 space-y-4">
          <LeadsChart data={chartData} />
          <LeadsStatusChart data={chartData} />
        </div>

        {/* Metrics Grid */}
        {/* Metrics Section by Category */}
        <div className="space-y-8 mt-10">
          {metricGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {group.title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((m) => (
                  <MetricCard
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    prefix={m.prefix}
                    suffix={m.suffix}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
