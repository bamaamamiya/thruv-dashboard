// app/dashboard/AbandonedLeadRowMobile.jsx
"use client";

import { useState, useCallback } from "react";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const copyToClipboard = async (text, onCopied) => {
  if (typeof navigator === "undefined") return;
  try {
    await navigator.clipboard.writeText(text);
    onCopied?.();
  } catch (err) {
    console.error("Clipboard error:", err);
    alert("Gagal menyalin teks.");
  }
};

export default function AbandonedLeadRowMobile({ lead, copiedId, setCopiedId }) {
  const [showModal, setShowModal] = useState(false);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (newStatus === lead.status) return;
      try {
        await updateDoc(doc(db, "abandonedLeads", lead.id), { status: newStatus });
        lead.status = newStatus;
      } catch (err) {
        console.error("Gagal update status:", err);
        alert("Gagal update status.");
      }
    },
    [lead]
  );

  const handleCopy = () => {
    const pesan = `Halo ${lead.name || "Kak"},  
Kami lihat Kakak sempat isi data tapi belum melanjutkan pesanan.  
Produk: ${lead.productTitle}  

Kalau Kakak masih berminat, tinggal klik link ini ya 👉 wa.me/${lead.whatsapp}`;
    copyToClipboard(pesan, () => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async () => {
    if (window.confirm(`Hapus abandoned lead atas nama ${lead.name}?`)) {
      await deleteDoc(doc(db, "abandonedLeads", lead.id));
      setShowModal(false);
    }
  };

  const statusOptions = [
    { value: "abandoned", label: "🛑 Abandoned" },
    { value: "followup", label: "📞 Follow Up" },
    { value: "converted", label: "✅ Converted" },
  ];

  return (
    <>
      {/* Card row */}
      <div
        onClick={() => setShowModal(true)}
        className="rounded-xl p-4 mb-3 shadow-sm hover:ring ring-gray-200 dark:hover:ring-gray-600 transition cursor-pointer bg-white dark:bg-gray-900"
      >
        <div className="flex justify-between text-sm text-gray-400 dark:text-gray-500 mb-2">
          <span>
            {new Date(lead.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <span
            className={`uppercase font-semibold text-xs ${
              lead.status === "converted"
                ? "text-green-500 dark:text-green-400"
                : lead.status === "followup"
                ? "text-yellow-500 dark:text-yellow-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {lead.status}
          </span>
        </div>
        <div className="text-gray-800 dark:text-gray-100 font-semibold text-base">
          {lead.name}
        </div>
        <div className="text-blue-600 dark:text-blue-400 text-sm mb-1">{lead.whatsapp}</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{lead.productTitle}</div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-sm p-6 rounded-xl shadow-xl relative text-sm text-gray-900 dark:text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl transition"
            >
              ❌
            </button>

            <h2 className="text-lg font-semibold mb-4">🛑 Detail Abandoned Lead</h2>

            <p><strong>Nama:</strong> {lead.name}</p>
            <p>
              <strong>WA:</strong>{" "}
              <a
                href={`https://wa.me/${lead.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {lead.whatsapp}
              </a>
            </p>
            <p><strong>Produk:</strong> {lead.productTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Masuk: {new Date(lead.createdAt.seconds * 1000).toLocaleString("id-ID")}
            </p>

            {/* Status Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition ${
                    lead.status === value
                      ? value === "converted"
                        ? "bg-green-500 dark:bg-green-400 text-white"
                        : value === "followup"
                        ? "bg-yellow-500 dark:bg-yellow-400 text-white"
                        : "bg-red-500 dark:bg-red-400 text-white"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handleCopy}
                className="bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Follow-up"}
              </button>

              <button
                onClick={handleDelete}
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm flex transition"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
