"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faFileExcel } from "@fortawesome/free-solid-svg-icons";

import LeadRow from "@/app/components/order/LeadRow";
import LeadRowMobile from "@/app/components/order/LeadRowMobile";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfDay, endOfDay } from "date-fns";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { FILTER_OPTIONS, getDateRange } from "@/utils/dateFilters"; // sesuaikan path

export default function LeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("month");
  const [customRange, setCustomRange] = useState([null, null]);

  const [startDate, endDate] = getDateRange(selectedFilter, customRange);

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
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
  const statusOptions = ["Semua", "pending", "complete", "cancel", "rts"];

  const handleSelectLead = (lead, isChecked) => {
    setSelectedLeads((prev) => {
      if (isChecked) {
        return [...prev, lead];
      } else {
        return prev.filter((l) => l.id !== lead.id);
      }
    });
  };

  const clean = (val) =>
    (val || "")
      .toString()
      .replace(/,/g, " ")
      .replace(/\r?\n|\r/g, " ")
      .trim();

  const headers = [
    "Nama Penerima",
    "Alamat Penerima",
    "Nomor Telepon",
    "Harga Barang (Jika NON-COD)",
    "Nilai COD (Jika COD)",
    "Isi Paketan (Nama Produk)",
    "Berat",
    "Kode Pos",
  ];

  const exportToCSV = () => {
    if (selectedLeads.length === 0) {
      alert("Pilih minimal 1 lead untuk export!");
      return;
    }

    const rows = selectedLeads.map((l) => {
      const paymentMethod = (l.paymentMethod || "").toLowerCase();

      return [
        clean(l.name),
        `"${clean(l.address)}"`,
        clean(l.whatsapp),
        paymentMethod === "non-cod" ? l.price ?? "" : "",
        paymentMethod === "cod" ? l.price + l.ongkir ?? "" : "",
        clean(l.productTitle),
        "1",
        l.postalCode ?? "",
      ];
    });

    const csvContent =
      "\uFEFF" + [headers, ...rows].map((row) => row.join(",")).join("\n");

    const fileName =
      selectedLeads.length === 1
        ? `${clean(selectedLeads[0].name)}.csv`
        : `${new Date().toISOString().split("T")[0]}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);

    setShowExportModal(false);
  };

  const exportToXLS = () => {
    if (selectedLeads.length === 0) {
      alert("Pilih minimal 1 lead untuk export!");
      return;
    }

    const rows = selectedLeads.map((l) => {
      const paymentMethod = (l.paymentMethod || "").toLowerCase();

      return [
        clean(l.name),
        clean(l.address),
        clean(l.whatsapp),
        paymentMethod === "non-cod" ? l.price ?? "" : "",
        paymentMethod === "cod" ? l.price + l.ongkir ?? "" : "",
        clean(l.productTitle),
        "1",
        l.postalCode ?? "",
      ];
    });

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Styling header cells: bold + center
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true, // enable styling
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    const fileName =
      selectedLeads.length === 1
        ? `${clean(selectedLeads[0].name)}.xlsx`
        : `${new Date().toISOString().split("T")[0]}.xlsx`;

    saveAs(blob, fileName);

    setShowExportModal(false);
  };

  return (
    <div className="font-sans">
      <div className="min-h-screen  text-gray-900 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-center mb-8 dark:text-white">
            📦 Order Masuk
          </h1>

          <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
            <select
              className="border border-gray-300 rounded px-4 py-2 shadow-sm dark:text-white"
              value={selectedFilter}
              onChange={(e) => {
                setSelectedFilter(e.target.value);
                if (e.target.value !== "custom") {
                  setCustomRange([null, null]);
                }
              }}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option
                  key={opt.key}
                  value={opt.key}
                  className="dark:bg-gray-900"
                >
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

            {/* Status filter and export button here */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className=" border uppercase border-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[200px] dark:text-white dark:bg-gray-900"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="uppercase">
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowExportModal(true)}
              className="border border-gray-300 text-gray-800 px-5 py-2.5 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-emerald-500 
          shadow-sm transition-all duration-200 font-medium dark:text-white "
            >
              Export Data
            </button>
          </div>

          {/* <div className="mb-6 flex flex-wrap gap-4 justify-between items-center w-full">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              placeholderText="Filter by date"
              className=" border border-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[200px]"
              dateFormat="dd/MM/yyyy"
              isClearable
            />
          </div> */}

          {showExportModal && (
            <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-xs w-full p-6">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 text-center">
                  Pilih format export
                </h2>

                <button
                  className="w-full mb-4 py-3 rounded-md border border-black text-black bg-white hover:bg-black hover:text-white transition font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    exportToCSV();
                    setShowExportModal(false);
                  }}
                  aria-label="Export CSV"
                >
                  <FontAwesomeIcon icon={faFileCsv} />
                  Export CSV
                </button>

                <button
                  className="w-full py-3 rounded-md border border-black text-black bg-white hover:bg-black hover:text-white transition font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    exportToXLS();
                    setShowExportModal(false);
                  }}
                  aria-label="Export XLS"
                >
                  <FontAwesomeIcon icon={faFileExcel} />
                  Export XLS (Excel)
                </button>

                <button
                  className="mt-6 w-full text-center text-gray-600 hover:text-gray-900 underline text-sm font-medium"
                  onClick={() => setShowExportModal(false)}
                  aria-label="Cancel export"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isMobile && (
            <div className="grid grid-cols-9 border-b text-center border-gray-200 py-3 text-sm font-medium text-gray-500 px-2">
              <span>Select</span>
              <span>Tanggal</span>
              <span>Nama</span>
              <span>WhatsApp</span>
              <span>Metode</span>
              <span>Produk</span>
              <span>Status</span>
              <span>Konfirmasi</span>
              <span>Resi</span>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead, index) => {
              const currentMonth = new Date(
                lead.createdAt.seconds * 1000
              ).toLocaleString("id-ID", {
                month: "long",
                year: "numeric",
              });

              const prevLead = filteredLeads[index - 1];
              const prevMonth =
                prevLead &&
                new Date(prevLead.createdAt.seconds * 1000).toLocaleString(
                  "id-ID",
                  {
                    month: "long",
                    year: "numeric",
                  }
                );

              const showMonth = index === 0 || currentMonth !== prevMonth;

              return (
                <div key={lead.id}>
                  {showMonth && (
                    <div className="text-center text-sm font-medium text-gray-500 py-2 bg-gray-50 rounded-md my-4">
                      📅 {currentMonth}
                    </div>
                  )}
                  {isMobile ? (
                    <LeadRowMobile
                      lead={lead}
                      copiedId={copiedId}
                      setCopiedId={setCopiedId}
                      onSelect={handleSelectLead}
                    />
                  ) : (
                    <LeadRow
                      lead={lead}
                      copiedId={copiedId}
                      setCopiedId={setCopiedId}
                      onSelect={handleSelectLead}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
