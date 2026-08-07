"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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

  const allFilteredSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((lead) =>
      selectedLeads.some((selected) => selected.id === lead.id),
    );

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads((prev) => {
        const existingIds = new Set(prev.map((lead) => lead.id));

        const newLeads = filteredLeads.filter(
          (lead) => !existingIds.has(lead.id),
        );

        return [...prev, ...newLeads];
      });
    } else {
      const filteredIds = new Set(filteredLeads.map((lead) => lead.id));

      setSelectedLeads((prev) =>
        prev.filter((lead) => !filteredIds.has(lead.id)),
      );
    }
  };

  const handleSelectLead = (lead, isChecked) => {
    setSelectedLeads((prev) => {
      if (isChecked) {
        // Jangan masukkan dua kali
        if (prev.some((selected) => selected.id === lead.id)) {
          return prev;
        }

        return [...prev, lead];
      }

      // Uncheck → hapus dari selection
      return prev.filter((selected) => selected.id !== lead.id);
    });
  };
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

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) {
      alert("Pilih minimal 1 order.");
      return;
    }

    const selectedCount = selectedLeads.length;

    const confirmed = window.confirm(
      `Hapus ${selectedCount} order yang dipilih?`,
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedLeads.map((lead) => deleteDoc(doc(db, "leads", lead.id))),
      );

      setSelectedLeads([]);

      alert(`${selectedCount} order berhasil dihapus.`);
    } catch (error) {
      console.error("Gagal menghapus order:", error);

      alert("Gagal menghapus order.");
    }
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
        clean(l.addressClean || l.address),
        clean(l.province),
        clean(l.whatsapp),
        paymentMethod === "non-cod" ? (l.price ?? "") : "",
        paymentMethod === "cod" ? (l.price ?? 0) + (l.ongkir ?? 0) : "",
        clean(l.productTitle),
        "1",
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
    <div className="w-full text-gray-800 dark:text-gray-200">
      {/* =========================
        TOP TOOLBAR
    ========================= */}

      <div
        className="
      flex
      flex-col
      lg:flex-row
      lg:items-center
      lg:justify-between
      gap-3
      mb-4
    "
      >
        <div>
          <h1 className="text-lg font-bold">Orders</h1>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage and monitor your leads
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="
            px-3
            py-2
            rounded-lg
            border
            border-gray-300
            dark:border-gray-700
            bg-white
            dark:bg-black
            text-xs
            font-medium
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
          "
          >
            📤 Export Order
          </button>

          <button
            onClick={exportCompleteAndRTS}
            className="
            px-3
            py-2
            rounded-lg
            border
            border-gray-300
            dark:border-gray-700
            bg-white
            dark:bg-black
            text-xs
            font-medium
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
          "
          >
            📊 Export Data
          </button>
        </div>
      </div>

      {/* =========================
        FILTER + SUMMARY
    ========================= */}

      <div
        className="
      flex
      flex-col
      xl:flex-row
      xl:items-center
      gap-4
      mb-4
      p-3
      rounded-xl
      border
      border-gray-200
      dark:border-gray-800
      bg-white
      dark:bg-black
    "
      >
        {/* DATE FILTER */}

        <div className="flex items-center gap-2">
          <select
            className="
            px-3
            py-2
            text-xs
            rounded-lg
            border
            border-gray-200
            dark:border-gray-700
            bg-gray-50
            dark:bg-gray-900
            outline-none
          "
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
              className="
              w-[140px]
              px-3
              py-2
              text-xs
              rounded-lg
              border
              border-gray-200
              dark:border-gray-700
              bg-gray-50
              dark:bg-black
              outline-none
            "
            />
          )}
        </div>

        {/* SUMMARY */}

        <div
          className="
        flex
        items-center
        gap-6
        xl:ml-auto
        overflow-x-auto
      "
        >
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Total</p>

            <p className="text-sm font-bold">{summary.totalOrders}</p>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase">Complete</p>

            <p className="text-sm font-bold text-green-500">
              {summary.completedOrders}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase">Pending</p>

            <p className="text-sm font-bold text-yellow-500">
              {summary.pendingOrders}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase">RTS</p>

            <p className="text-sm font-bold text-red-500">
              {summary.rtsOrders}
            </p>
          </div>
        </div>
      </div>

      {/* =========================
        STATUS FILTER
    ========================= */}

      <div
        className="
      flex
      items-center
      gap-1
      mb-4
      overflow-x-auto
    "
      >
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`
            px-3
            py-1.5
            rounded-lg
            text-xs
            font-medium
            whitespace-nowrap
            transition

            ${
              selectedStatus === tab.key
                ? `
                  bg-black
                  text-white
                  dark:bg-white
                  dark:text-black
                `
                : `
                  text-gray-500
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                `
            }
          `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================
  BULK ACTION
========================= */}

      {selectedLeads.length > 0 && (
        <div
          className="
      mb-3
      flex
      items-center
      justify-between
      gap-3
      px-4
      py-3
      rounded-xl
      border
      border-gray-200
      dark:border-gray-800
      bg-white
      dark:bg-gray-900
    "
        >
          <div className="flex items-center gap-3">
            <div
              className="
          w-7
          h-7
          rounded-lg
          bg-gray-100
          dark:bg-gray-800
          flex
          items-center
          justify-center
          text-xs
          font-bold
        "
            >
              {selectedLeads.length}
            </div>

            <div>
              <p className="text-xs font-semibold">Order dipilih</p>

              <p className="text-[10px] text-gray-500">
                {selectedLeads.length} order siap diproses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetSelection}
              className="
          px-3
          py-2
          rounded-lg
          text-xs
          font-medium
          text-gray-500
          hover:bg-gray-100
          dark:hover:bg-gray-800
        "
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="
          px-3
          py-2
          rounded-lg
          bg-red-600
          text-white
          text-xs
          font-semibold
          hover:bg-red-700
          transition
        "
            >
              🗑️ Hapus {selectedLeads.length} Order
            </button>
          </div>
        </div>
      )}

      {/* =========================
        TABLE HEADER
    ========================= */}

      {!isMobile && (
        <div
          className="
        px-2
        mb-1
      "
        >
          <div
            className="
          grid
          grid-cols-10
          items-center
          gap-1
          py-2
          text-[10px]
          uppercase
          tracking-wide
          font-semibold
          text-gray-400
        "
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="
      scale-100
      accent-gray-800
      dark:accent-gray-200
      cursor-pointer
    "
              />
            </div>

            <span>Tanggal</span>

            <span>Nama</span>

            <span className="text-center">WhatsApp</span>

            <span className="text-center">Metode</span>

            <span className="text-center">Produk</span>

            <span className="text-center">Status</span>

            <span className="text-center">Confirm</span>

            <span className="text-center">Resi</span>

            <span className="text-center">AI</span>
          </div>
        </div>
      )}

      {/* =========================
        LEADS
    ========================= */}

      <div
        className="
      divide-y
      divide-gray-100
      dark:divide-gray-800
    "
      >
        {filteredLeads.length === 0 ? (
          <div
            className="
          py-12
          text-center
          text-xs
          text-gray-500
        "
          >
            Tidak ada lead.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id}>
              {isMobile ? (
                <LeadRowMobile
                  lead={lead}
                  copiedId={copiedId}
                  setCopiedId={setCopiedId}
                  onSelect={handleSelectLead}
                  products={products}
                />
              ) : (
                <LeadRow
                  lead={lead}
                  copiedId={copiedId}
                  setCopiedId={setCopiedId}
                  onSelect={handleSelectLead}
                  selectedLeads={selectedLeads}
                  products={products}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* =========================
        EXPORT MODAL
    ========================= */}

      {showExportModal && (
        <div
          className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        backdrop-blur-sm
        p-4
      "
        >
          <div
            className="
          w-full
          max-w-sm
          rounded-2xl
          bg-white
          dark:bg-gray-900
          border
          border-gray-200
          dark:border-gray-800
          shadow-2xl
          p-5
        "
          >
            <div className="mb-5">
              <h2 className="text-base font-bold">Export Order</h2>

              <p
                className="
              text-xs
              text-gray-500
              mt-1
            "
              >
                Pilih format file yang ingin digunakan.
              </p>
            </div>

            <div className="space-y-2">
              <button
                className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-2.5
                rounded-lg
                border
                border-gray-300
                dark:border-gray-700
                text-xs
                font-semibold
                hover:bg-gray-100
                dark:hover:bg-gray-800
                transition
              "
                onClick={() => {
                  exportToCSV();
                  setShowExportModal(false);
                }}
              >
                <FontAwesomeIcon icon={faFileCsv} />
                Export CSV
              </button>

              <button
                className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-2.5
                rounded-lg
                bg-black
                dark:bg-white
                text-white
                dark:text-black
                text-xs
                font-semibold
                hover:opacity-90
                transition
              "
                onClick={() => {
                  exportToXLS();
                  setShowExportModal(false);
                }}
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Export Excel
              </button>
            </div>

            <button
              className="
              mt-4
              w-full
              py-2
              text-xs
              text-gray-500
              hover:text-gray-900
              dark:hover:text-white
            "
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
