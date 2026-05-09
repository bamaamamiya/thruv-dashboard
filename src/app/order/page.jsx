"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faFileExcel } from "@fortawesome/free-solid-svg-icons";

import LeadRow from "@/app/components/order/LeadRow";
import LeadRowMobile from "@/app/components/order/LeadRowMobile";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDateRange, FILTER_OPTIONS } from "@/utils/dateFilters";
import { calculateSummary } from "@/utils/processLeads";
export default function LeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedFilter, setSelectedFilter] = useState("week");
  const [customRange, setCustomRange] = useState([null, null]);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const [startDate, endDate] = useMemo(
    () => getDateRange(selectedFilter, customRange),
    [selectedFilter, customRange],
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(data);
    });

    return () => unsubscribe();
  }, []);

  // 📦 FETCH ON FILTER CHANGE (GETDOCS ONLY)
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);

      try {
        const q = query(collection(db, "leads"));
        const snap = await getDocs(q);

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setLeads(data);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchLeads();
  }, [selectedFilter, customRange]);

  // 📱 mobile detect
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🧠 FILTER LOGIC
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchStatus =
        selectedStatus === "Semua" || lead.status === selectedStatus;

      const time = lead.createdAt?.seconds
        ? lead.createdAt.seconds * 1000
        : null;

      const matchDate =
        (!startDate && !endDate) ||
        (time && time >= startDate?.getTime() && time <= endDate?.getTime());

      return matchStatus && matchDate;
    });
  }, [leads, selectedStatus, startDate, endDate]);

  const statusOptions = ["Semua", "pending", "complete", "cancel", "rts"];

  // 📊 SUMMARY (FIXED)
  const summary = useMemo(() => {
    return calculateSummary(filteredLeads, 0); // masih 0 kalau belum ada adSpend source
  }, [filteredLeads]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading leads...
      </div>
    );
  }

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

  const exportCompleteAndRTS = () => {
    const filtered = leads.filter((l) => {
      const leadTime = l.createdAt?.seconds ? l.createdAt.seconds * 1000 : null;

      if (!leadTime) return false;

      // filter tanggal (reuse UI filter)
      if (startDate && endDate) {
        if (leadTime < startDate.getTime() || leadTime > endDate.getTime())
          return false;
      }

      return l.status === "complete" || l.status === "rts";
    });

    const completed = filtered.filter((l) => l.status === "complete");
    const rts = filtered.filter((l) => l.status === "rts");

    if (completed.length === 0 && rts.length === 0) {
      alert("Tidak ada data COMPLETE atau RTS di rentang ini.");
      return;
    }

    const headers = [
      "Nama",
      "No WhatsApp",
      "Produk",
      "Harga",
      "Cost Produk",
      "Ongkir",
      "Biaya Return",
      "Alamat",
    ];

    const mapRow = (l) => [
      clean(l.name),
      clean(l.whatsapp),
      clean(l.productTitle),
      l.price ?? 0,
      l.costProduct ?? 0,
      l.ongkir ?? 0,
      l.rts ?? 0,
      clean(l.addressClean || l.address),
    ];

    const workbook = XLSX.utils.book_new();

    // ===== SHEET COMPLETE =====
    if (completed.length > 0) {
      const wsComplete = XLSX.utils.aoa_to_sheet([
        headers,
        ...completed.map(mapRow),
      ]);
      styleHeader(wsComplete);
      XLSX.utils.book_append_sheet(workbook, wsComplete, "COMPLETE");
    }

    // ===== SHEET RTS =====
    if (rts.length > 0) {
      const wsRTS = XLSX.utils.aoa_to_sheet([headers, ...rts.map(mapRow)]);
      styleHeader(wsRTS);
      XLSX.utils.book_append_sheet(workbook, wsRTS, "RTS");
    }

    const label =
      selectedFilter === "custom" && startDate && endDate
        ? `${startDate.toISOString().slice(0, 10)}_to_${endDate
            .toISOString()
            .slice(0, 10)}`
        : selectedFilter;

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `orders-complete-rts-${label}.xlsx`,
    );
  };

  const styleHeader = (worksheet) => {
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true },
          alignment: { horizontal: "center" },
        };
      }
    }
  };

  const resetSelection = () => {
    setSelectedLeads([]);
  };

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
        paymentMethod === "non-cod" ? (l.price ?? "") : "",
        paymentMethod === "cod" ? (l.price + l.ongkir ?? "") : "",
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
    resetSelection();
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
        paymentMethod === "non-cod" ? (l.price ?? "") : "",
        paymentMethod === "cod" ? (l.price + l.ongkir ?? "") : "",
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
    resetSelection();
  };

  const statusTabs = [
    { key: "Semua", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "complete", label: "Complete" },
    { key: "cancel", label: "Cancel" },
    { key: "rts", label: "RTS" },
  ];

  return (
    <div className="font-sans">
      <div className="h-full text-gray-900 ">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="border border-gray-300 text-gray-800 px-2 py-1.5 rounded-md 
							focus:outline-none focus:ring-2 focus:ring-emerald-500 
							shadow-sm transition-all duration-200 font-medium dark:text-white text-xs"
            >
              Export Order
            </button>

            <button
              onClick={exportCompleteAndRTS}
              className="border border-gray-300 text-gray-800 px-2 py-1.5 rounded-md
							focus:outline-none focus:ring-2 focus:ring-indigo-500
							shadow-sm transition-all duration-200 font-medium dark:text-white text-xs"
            >
              Export Data
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4 mt-3 bg-white dark:bg-black dark:text-white border border-gray-200 rounded-xl p-2">
            <select
              className="px-2 py-1 md:px-4 md:py-4 text-xs rounded-md dark:bg-black dark:text-white border border-gray-200"
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
                placeholderText="Custom"
                className="w-full max-w-[140px] px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm dark:text-white bg-white dark:bg-black"
              />
            )}
            <div>
              <div className="flex space-x-2 text-xs ml-4 md:space-x-30">
                <div className="border-l p-2 border-gray-300 ">
                  <p className="dark:text-white">Total</p>
                  <p className="font-bold dark:text-white">
                    {summary.totalOrders}
                  </p>
                </div>
                <div className="border-l p-2 border-gray-300">
                  <p className="dark:text-white">Complete</p>
                  <p className="font-bold text-green-500">
                    {summary.completedOrders}
                  </p>
                </div>
                <div className="border-l p-2 border-gray-300">
                  <p className="dark:text-white">Pending</p>
                  <p className="font-bold text-yellow-500">
                    {summary.pendingOrders}
                  </p>
                </div>
                <div className="border-l p-2 border-gray-300">
                  <p className="dark:text-white">Returns</p>
                  <p className="font-bold text-red-500">{summary.rtsOrders}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center mb-6 justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition 
        ${
          selectedStatus === tab.key
            ? "bg-gray-200 text-black dark:bg-gray-100 dark:text-black"
            : " text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {showExportModal && (
            <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50">
              <div className="bg-gray-50 rounded-lg shadow-xl max-w-xs w-full p-6">
                <h2 className="text-xl font-semibold mb-5 text-gray-900 text-center">
                  Pilih format export
                </h2>

                <button
                  className="w-full mb-4 py-3 rounded-md border border-black text-black bg-gray-50 hover:bg-black hover:text-white transition font-medium flex items-center justify-center gap-2"
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
                  className="w-full py-3 rounded-md border border-black text-black bg-gray-50 hover:bg-black hover:text-white transition font-medium flex items-center justify-center gap-2"
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
            <div className="px-2">
              <div className="grid grid-cols-9 items-center text-center py-2 text-xs font-medium text-gray-500">
                <div></div>
                <span>Tanggal</span>
                <span>Nama</span>
                <span>WhatsApp</span>
                <span>Metode</span>
                <span>Produk</span>
                <span>Status</span>
                <span>Konfirmasi</span>
                <span>Resi</span>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead, index) => {
              const currentMonth = new Date(
                lead.createdAt.seconds * 1000,
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
                  },
                );

              return (
                <div key={lead.id}>
                  {isMobile ? (
                    <LeadRowMobile
                      lead={lead}
                      copiedId={copiedId}
                      setCopiedId={setCopiedId}
                      onSelect={handleSelectLead}
                      products={products} // 🔥 tambah ini
                    />
                  ) : (
                    <LeadRow
                      lead={lead}
                      copiedId={copiedId}
                      setCopiedId={setCopiedId}
                      onSelect={handleSelectLead}
                      selectedLeads={selectedLeads}
                      products={products} // 🔥 tambah ini
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
