// AbandonedLeadRow.jsx
import { useState, useCallback } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
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

export default function AbandonedLeadRow({ lead, copiedId, setCopiedId }) {
  const [showModal, setShowModal] = useState(false);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (newStatus === lead.status) return;
      try {
        await updateDoc(doc(db, "abandonedLeads", lead.id), {
          status: newStatus,
        });
        lead.status = newStatus; // refresh cepat
      } catch (err) {
        console.error("Gagal update status:", err);
        alert("Gagal update status.");
      }
    },
    [lead]
  );

  const productLinks = {
    "CCTV E27": "https://thruv.vercel.app/cctv",
    "Alat Pijat 4 in 1": "https://thruv.vercel.app/pijat",
    // tambahkan produk lain di sini
  };

  const handleCopy = () => {
  const pesan = `Permisi Kak ${lead.name || ""} 🌟,
Aku cek tadi Kak sempat lihat produk kami *${lead.productTitle}* tapi belum tulis alamat lengkap🙏

Khusus Kak aku kasih diskon 50% ya. Silakan tulis alamat lengkap kalau masih minat sama promonya😊`;

  copyToClipboard(pesan, () => {
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  });
};


  const statusOptions = [
    { value: "abandoned", label: "🛑 Abandoned" },
    { value: "followup", label: "📞 Follow Up" },
    { value: "converted", label: "✅ Converted" },
  ];

  return (
    <>
      {/* Row */}
      <div
        className="grid text-sm grid-cols-5 items-center gap-2 cursor-pointer 
          hover:bg-gray-100 dark:hover:bg-gray-800 
          px-3 py-2 rounded-md transition 
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900"
        onClick={() => setShowModal(true)}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(lead.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {lead.name}
        </span>
        <a
          href={`https://wa.me/${lead.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.whatsapp}
        </a>
        <span className="truncate text-gray-800 dark:text-gray-200">
          {lead.productTitle}
        </span>
        <span
          className={`uppercase font-semibold text-xs text-center ${
            lead.status === "converted"
              ? "text-green-600 dark:text-green-400"
              : lead.status === "followup"
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {lead.status}
        </span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm p-6 rounded-xl shadow-xl relative text-sm text-gray-900 dark:text-gray-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl transition"
              aria-label="Close modal"
            >
              ❌
            </button>

            <h2 className="text-lg font-semibold mb-4">
              🛑 Detail Abandoned Lead
            </h2>

            <p>
              <strong>Nama:</strong> {lead.name}
            </p>
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
            <p>
              <strong>Produk:</strong> {lead.productTitle}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Masuk:{" "}
              {new Date(lead.createdAt.seconds * 1000).toLocaleString("id-ID")}
            </p>

            {/* Status Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    lead.status === value
                      ? "bg-gray-900 dark:bg-gray-700 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                className="bg-gray-900 dark:bg-gray-700 text-white 
               text-xs font-semibold px-3 py-1 rounded-md 
               hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Follow-up"}
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(`Hapus abandoned lead ${lead.name}?`)) {
                    await deleteDoc(doc(db, "abandonedLeads", lead.id));
                    setShowModal(false);
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm transition"
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
