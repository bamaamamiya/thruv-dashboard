"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

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
  const [leads, setLeads] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([new Date(), new Date()]);

  // 🔹 Listen to Firestore
  useEffect(() => {
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
  }, []);

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
  const metrics = [
    { label: "Total Sales", value: summary.totalSales, prefix: "Rp" },
    { label: "Gross Profit", value: summary.grossProfit, prefix: "Rp" },
    { label: "AOV", value: summary.avgOrderValue, prefix: "Rp" },
    { label: "Gross Margin", value: summary.grossMargin, suffix: "%" },
    { label: "Profit Margin", value: summary.profitMargin, suffix: "%" },
    { label: "Ad Cost / Order", value: summary.adCostPerOrder, prefix: "Rp" },
    { label: "CAC", value: summary.cac, prefix: "Rp" },
    { label: "CLV", value: summary.clv, prefix: "Rp" },
    { label: "Total Ad Spend", value: totalAdSpend, prefix: "Rp" },
    { label: "Total Product Cost", value: summary.totalCost, prefix: "Rp" },
    {
      label: "Return Cost (RTS)",
      value: summary.totalReturnToSenderCost,
      prefix: "Rp",
    },
    { label: "Pending Value", value: summary.totalPendingValue, prefix: "Rp" },
    { label: "Net Profit", value: summary.netProfit, prefix: "Rp" },
    { label: "Number of Orders (Complete)", value: summary.completedOrders },
    { label: "Number of Orders (Pending)", value: summary.pendingOrders },
    { label: "ROAS", value: roas, suffix: "x" },
    { label: "LTGP : CAC", value: summary.ltgpToCac, suffix: "x" },
    { label: "Conversion Rate", value: summary.conversionRate, suffix: "%" }, // ✅ baru
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {metrics.map((m) => (
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
    </div>
  );
}
