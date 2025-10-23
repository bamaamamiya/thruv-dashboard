"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FilterBar from "@/app/components/analytics/FilterBar";
import LeadsChart from "@/app/components/analytics/LeadsChart";
import MetricCard from "@/app/components/analytics/MetricCard";
import LeadsStatusChart from "./components/analytics/LeadsStatusChart";

import { getDateRange } from "@/utils/dateFilters";
import {
  filterLeadsByDate,
  calculateSummary,
  generateChartData,
  filterAdsByDate,
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

  // 🔹 Redirect kalau belum login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 🔹 Listen to Firestore (jalankan setelah login)
  useEffect(() => {
    if (!user) return;

    const unsubLeads = onSnapshot(collection(db, "leads"), (snapshot) =>
      setLeads(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubAds = onSnapshot(collection(db, "adSpends"), (snapshot) =>
      setAds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubLeads();
      unsubAds();
    };
  }, [user]);

  // 🔹 Loading & redirect states
  if (loading)
    return (
      <div className="text-center flex justify-center items-center">
        <p>Welcome Back,BAMA...</p>
      </div>
    );
  if (!user) return null;

  // 🔹 Date filters
  const [start, end] = getDateRange(selectedFilter, customRange);
  const filteredLeads = filterLeadsByDate(leads, start, end);
  const filteredAds = filterAdsByDate(ads, start, end);
  const previousSummary = {};

  // 🔹 Summaries
  const totalAdSpend = calculateTotalAdSpend(filteredAds);
  const uniqueCustomers = new Set(filteredLeads.map((l) => l.phone || l.email))
    .size;
  const summary = calculateSummary(
    filteredLeads,
    totalAdSpend,
    uniqueCustomers,
    0
  );

  const chartData = generateChartData(
    filteredLeads,
    selectedFilter,
    start,
    end
  );
  const roas =
    totalAdSpend > 0
      ? Number((summary.totalSales / totalAdSpend).toFixed(2))
      : 0;

  // 🔹 Metric list
  const metricGroups = [
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
        { label: "Pending Profit", value: summary.pendingProfit, prefix: "Rp" },
      ],
    },
    {
      title: "🏭 Cost & Return",
      items: [
        { label: "Total Product Cost", value: summary.totalCost, prefix: "Rp" },
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
