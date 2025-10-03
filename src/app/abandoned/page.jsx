// app/abandoned/page.jsx
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faFileExcel } from "@fortawesome/free-solid-svg-icons";

import AbandonedLeadRow from "@/app/components/abandoned/AbandonedLeadRow";
import AbandonedLeadRowMobile from "@/app/components/abandoned/AbandonedLeadRowMobile";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { FILTER_OPTIONS, getDateRange } from "@/utils/dateFilters";

export default function AbandonedDashboard() {
  const [leads, setLeads] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("allTime");
  const [customRange, setCustomRange] = useState([null, null]);

  const [startDate, endDate] = getDateRange(selectedFilter, customRange);

  useEffect(() => {
    const q = query(
      collection(db, "abandonedLeads"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeads(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchStatus =
      selectedStatus === "Semua" || lead.status === selectedStatus;

    const leadTime = lead.createdAt?.seconds
      ? lead.createdAt.seconds * 1000
      : null;

    const matchDate =
      (!startDate && !endDate) ||
      (leadTime &&
        leadTime >= startDate.getTime() &&
        leadTime <= endDate.getTime());

    return matchStatus && matchDate;
  });

  const statusOptions = ["Semua", "abandoned", "followup", "converted"];

  return (
    <div className="font-sans">
      <div className="min-h-screen text-gray-900 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-center mb-8 dark:text-white">
            🛑 Abandoned Leads
          </h1>

          {/* Filter */}
          <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
            <select
              className="border border-gray-300 rounded px-4 py-2 shadow-sm dark:text-white dark:bg-gray-900"
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
                onChange={(dates) => {
                  const [start, end] = dates;
                  setCustomRange([start, end]);
                }}
                startDate={customRange[0]}
                endDate={customRange[1]}
                selectsRange
                isClearable
                placeholderText="Select custom date range"
                className="border border-gray-300 rounded px-4 py-2 shadow-sm dark:text-white"
              />
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border uppercase border-gray-300 px-4 py-2 rounded-md shadow-sm dark:text-white dark:bg-gray-900"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="uppercase">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Header row */}
          {!isMobile && (
            <div className="grid grid-cols-5 border-b text-center border-gray-200 py-3 text-sm font-medium text-gray-500 px-2">
              <span>Tanggal</span>
              <span>Nama</span>
              <span>WhatsApp</span>
              <span>Produk</span>
              <span>Status</span>
            </div>
          )}

          {/* Leads */}
          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id}>
                {isMobile ? (
                  <AbandonedLeadRowMobile
                    lead={lead}
                    copiedId={copiedId}
                    setCopiedId={setCopiedId}
                  />
                ) : (
                  <AbandonedLeadRow
                    lead={lead}
                    copiedId={copiedId}
                    setCopiedId={setCopiedId}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
