"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import AbandonedLeadRow from "@/app/components/abandoned/AbandonedLeadRow";
import AbandonedLeadRowMobile from "@/app/components/abandoned/AbandonedLeadRowMobile";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { FILTER_OPTIONS, getDateRange } from "@/utils/dateFilters";

export default function AbandonedDashboard() {
  const [leads, setLeads] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedFilter, setSelectedFilter] = useState("allTime");
  const [customRange, setCustomRange] = useState([null, null]);

  const [loading, setLoading] = useState(true);

  const [startDate, endDate] = useMemo(() => {
    return getDateRange(selectedFilter, customRange);
  }, [selectedFilter, customRange]);

  // 🔥 FETCH DATA (NO SNAPSHOT)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let q;

        // kalau ada filter tanggal → query server-side
        if (startDate && endDate) {
          q = query(
            collection(db, "abandonedLeads"),
            where("createdAt", ">=", Timestamp.fromDate(startDate)),
            where("createdAt", "<=", Timestamp.fromDate(endDate)),
            orderBy("createdAt", "desc")
          );
        } else {
          q = query(
            collection(db, "abandonedLeads"),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLeads(data);
      } catch (err) {
        console.error("Fetch abandoned leads error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // 🔥 RESPONSIVE CHECK
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔥 FILTER STATUS (CLIENT SIDE ONLY SMALL DATA)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      return selectedStatus === "Semua" || lead.status === selectedStatus;
    });
  }, [leads, selectedStatus]);

  const statusOptions = ["Semua", "abandoned", "followup", "converted"];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading abandoned leads...
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="min-h-screen px-4 py-12 text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-center mb-8 dark:text-white">
            🛑 Abandoned Leads
          </h1>

          {/* FILTER */}
          <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
            <select
              className="border px-4 py-2 rounded dark:bg-gray-900 dark:text-white"
              value={selectedFilter}
              onChange={(e) => {
                setSelectedFilter(e.target.value);
                if (e.target.value !== "custom") {
                  setCustomRange([null, null]);
                }
              }}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            {selectedFilter === "custom" && (
              <DatePicker
                selected={customRange[0]}
                onChange={(dates) => setCustomRange(dates)}
                startDate={customRange[0]}
                endDate={customRange[1]}
                selectsRange
                isClearable
                className="border px-4 py-2 rounded dark:bg-gray-900 dark:text-white"
              />
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border px-4 py-2 rounded dark:bg-gray-900 dark:text-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* HEADER */}
          {!isMobile && (
            <div className="grid grid-cols-5 border-b py-3 text-sm text-gray-500">
              <span>Tanggal</span>
              <span>Nama</span>
              <span>WhatsApp</span>
              <span>Produk</span>
              <span>Status</span>
            </div>
          )}

          {/* LIST */}
          <div className="divide-y">
            {filteredLeads.map((lead) => (
              <div key={lead.id}>
                {isMobile ? (
                  <AbandonedLeadRowMobile lead={lead} />
                ) : (
                  <AbandonedLeadRow lead={lead} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}