"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient"; // pastikan alias @ sudah di-setup di jsconfig/tsconfig

import LeadRow from "@/app/components/order/LeadRow";
import LeadRowMobile from "@/app/components/order/LeadRowMobile";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfDay, endOfDay } from "date-fns";

export default function LeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);

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

    const matchDate =
      !selectedDate ||
      (lead.createdAt &&
        lead.createdAt.seconds * 1000 >= startOfDay(selectedDate).getTime() &&
        lead.createdAt.seconds * 1000 <= endOfDay(selectedDate).getTime());

    return matchStatus && matchDate;
  });

  const statusOptions = ["Semua", "pending", "complete", "cancel"];

  const handleSelectLead = (lead, isChecked) => {
    setSelectedLeads((prev) => {
      if (isChecked) {
        return [...prev, lead];
      } else {
        return prev.filter((l) => l.id !== lead.id);
      }
    });
  };

  const exportToCSV = () => {
    if (selectedLeads.length === 0) {
      alert("Pilih minimal 1 lead untuk export!");
      return;
    }

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

    const clean = (val) =>
      (val || "")
        .toString()
        .replace(/,/g, " ")
        .replace(/\r?\n|\r/g, " ")
        .trim();

    const rows = selectedLeads.map((l) => {
      const paymentMethod = (l.paymentMethod || "").toLowerCase();

      return [
        clean(l.name),
        `"${clean(l.address)}"`,
        clean(l.whatsapp),
        paymentMethod === "non-cod" ? l.price ?? "" : "",
        paymentMethod === "cod" ? l.price ?? "" : "",
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
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="font-sans">
      <div className="min-h-screen  text-gray-900 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-center mb-8">
            📦 Order Masuk
          </h1>

          <div className="mb-6 flex flex-wrap gap-4 justify-between items-center w-full">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              placeholderText="Filter by date"
              className=" border border-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[200px]"
              dateFormat="dd/MM/yyyy"
              isClearable
            />

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className=" border capitalize border-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-[200px]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              className=" border border-gray-300 text-gray-800 px-5 py-2.5 rounded-md 
             hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 
             shadow-sm transition-all duration-200 font-medium"
            >
              Export CSV
            </button>
          </div>

          {!isMobile && (
            <div className="grid grid-cols-8 border-b text-center border-gray-200 py-3 text-sm font-medium text-gray-500 px-2">
              <span>Select</span>
              <span>Tanggal</span>
              <span>Nama</span>
              <span>WhatsApp</span>
              <span>Metode</span>
              <span>Produk</span>
              <span>Status</span>
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
