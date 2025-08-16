// app/dashboard/LeadRow.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

// 🔹 Format currency short
const formatHargaSingkat = (harga) => {
  if (!harga) return "-";
  if (harga >= 1_000_000) {
    return (harga / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  }
  return (harga / 1000).toFixed(0) + "rb";
};

// 🔹 Copy to clipboard
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

// 🔹 Hook untuk debounce save Firestore
const useDebouncedSave = (value, originalValue, leadId, field) => {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (value !== originalValue) {
        setSaving(true);
        try {
          await updateDoc(doc(db, "leads", leadId), {
            [field]:
              field === "price" || field === "costProduct"
                ? Number(value)
                : value,
          });
          console.log(`✅ ${field} updated`);
        } catch (err) {
          console.error(`Gagal update ${field}:`, err);
          alert(`Gagal update ${field}.`);
        } finally {
          setSaving(false);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [value, originalValue, leadId, field]);

  return saving;
};

export default function LeadRow({ lead, copiedId, setCopiedId, onSelect }) {
  const [showModal, setShowModal] = useState(false);
  const [priceValue, setPriceValue] = useState(lead.price || "");
  const [costProductValue, setCostProductValue] = useState(
    lead.costProduct || ""
  );
  const [addressValue, setAddressValue] = useState(lead.address || "");
  const [returnValue, setReturnValue] = useState(lead.rts || "");
  const [isChecked, setIsChecked] = useState(false);

  const savingPrice = useDebouncedSave(
    priceValue,
    lead.price,
    lead.id,
    "price"
  );
  const savingCost = useDebouncedSave(
    costProductValue,
    lead.costProduct,
    lead.id,
    "costProduct"
  );
  const savingAddress = useDebouncedSave(
    addressValue,
    lead.address,
    lead.id,
    "address"
  );
  const savingReturn = useDebouncedSave(returnValue, lead.rts, lead.id, "rts");

  const updating = savingPrice || savingCost || savingAddress || savingReturn;

  const handleCheckboxChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      setIsChecked(checked);
      onSelect?.(lead, checked);
    },
    [lead, onSelect]
  );

  const handleSave = async () => {
    if (!priceValue || !costProductValue) {
      alert("Harga dan biaya produk tidak boleh kosong.");
      return;
    }
    try {
      await updateDoc(doc(db, "leads", lead.id), {
        price: Number(priceValue),
        costProduct: Number(costProductValue),
        address: addressValue,
        rts: Number(returnValue) || 0,
        status: lead.status,
        resiCheck: lead.resiCheck || "not",
      });
      setShowModal(false);
    } catch (err) {
      console.error("Gagal update:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (newStatus === lead.status) return;
      try {
        await updateDoc(doc(db, "leads", lead.id), { status: newStatus });
        lead.status = newStatus; // update langsung biar UI refresh
      } catch (err) {
        console.error("Gagal update status:", err);
        alert("Gagal update status.");
      }
    },
    [lead]
  );

  const handleResiCheckChange = useCallback(
    async (newResiCheck) => {
      if (newResiCheck === lead.resiCheck) return;
      try {
        await updateDoc(doc(db, "leads", lead.id), { resiCheck: newResiCheck });
      } catch (err) {
        console.error("Gagal update resiCheck:", err);
        alert("Gagal update status resi.");
      }
    },
    [lead]
  );

  const handleCopyAddress = () => {
    const prompt = `[PROVINSI], [KABUPATEN/KOTA], [KECAMATAN], [DESA/KELURAHAN] dan rapikan alamat lengkap, dan kelurahan terpisah.\n\nAlamat mentah: ${lead.address}`;
    copyToClipboard(prompt, () => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopy = () => {
    const pesan = `Terima kasih sudah melakukan pemesanan 🙏  
Berikut detail pesanan Kakak:

Nama Produk: ${lead.productTitle}  
Harga Produk: ${formatHargaSingkat(lead.price)}  
Ongkir: 
Total Pembayaran: 

Nama: ${lead.name}  
Alamat Lengkap: ${lead.address}

Apakah alamat yang Kakak berikan sudah benar?  
Kami akan segera proses pesanan Kakak jika alamatnya sudah sesuai ya.  
Untuk ongkir, akan dihitung otomatis dan dianggap disetujui oleh sistem 🙏`;

    copyToClipboard(pesan, () => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const statusOptions = [
    { value: "pending", label: "🕓 Pending" },
    { value: "complete", label: "✅ Complete" },
    { value: "cancel", label: "❌ Cancel" },
    { value: "rts", label: "🚚 RTS" },
  ];

  const resiOptions = [
    { value: "not", label: "🕓 Belum Dicek" },
    { value: "done", label: "📦 Resi Dicek" },
  ];

  return (
    <>
      {/* Lead Row */}
      <div
        className="grid text-sm grid-cols-8 items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-3 rounded-md transition border border-gray-200"
        onClick={() => setShowModal(true)}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select lead"
          className="scale-125"
        />
        <span className="text-xs text-gray-500">
          {new Date(lead.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="font-medium text-gray-900">{lead.name}</span>
        <a
          href={`https://wa.me/${lead.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.whatsapp}
        </a>
        <span className="text-green-600 font-medium text-center">
          {lead.paymentMethod}
        </span>
        <span className="text-gray-700 truncate">{lead.productTitle}</span>
        <span
          className={`uppercase font-semibold text-sm text-center ${
            lead.status === "complete"
              ? "text-green-500"
              : lead.status === "cancel"
              ? "text-red-500"
              : lead.status === "pending"
              ? "text-yellow-500"
              : "text-black"
          }`}
        >
          {lead.status}
        </span>
        <span
          className={`text-xs text-center font-semibold px-2 py-0.5 rounded-full ${
            lead.resiCheck === "done"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {lead.resiCheck === "done" ? "✅ Dicek" : "❌ Belum"}
        </span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative text-sm text-gray-800">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-black text-xl"
              aria-label="Close modal"
            >
              ❌
            </button>

            <h2 className="text-lg font-semibold mb-4">📄 Detail Lead</h2>

            <div className="space-y-2">
              <p>
                <strong>Nama:</strong> {lead.name}
              </p>
              <p>
                <strong>WA:</strong>
                <a
                  href={`https://wa.me/${lead.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {lead.whatsapp}
                </a>
              </p>

              <div>
                <strong>Harga Produk:</strong>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-full mt-1"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Masukkan harga jual terbaru"
                />
              </div>

              <div>
                <strong>Alamat:</strong>
                <textarea
                  className="border rounded px-2 py-1 text-sm w-full mt-1"
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  placeholder="Masukkan alamat baru"
                  rows={3}
                />
              </div>

              <p>
                <strong>Metode:</strong> {lead.paymentMethod}
              </p>
              <p>
                <strong>Produk:</strong> {lead.productTitle}
              </p>

              <div>
                <strong>Cost Product:</strong>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-full mt-1"
                  value={costProductValue}
                  onChange={(e) => setCostProductValue(e.target.value)}
                  placeholder="Masukkan cost product"
                />
              </div>

              <p>
                <strong>Resi Check:</strong> {lead.resiCheck || "not"}
              </p>
              <div>
                <strong>Biaya Return:</strong>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-full mt-1"
                  value={returnValue}
                  onChange={(e) => setReturnValue(e.target.value)}
                  placeholder="Masukkan biaya RTS"
                />
              </div>
              <p className="text-xs text-gray-500">
                Masuk:{" "}
                {new Date(lead.createdAt.seconds * 1000).toLocaleString(
                  "id-ID"
                )}
              </p>

              <button
                onClick={handleSave}
                disabled={updating}
                className="w-full bg-black text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-gray-800 transition"
              >
                {updating ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
            </div>

            {/* Status Buttons */}
            <div className="flex flex-wrap gap-2 mt-5">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  disabled={updating}
                  onClick={() => handleStatusChange(value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    lead.status === value
                      ? "bg-black text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Resi Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {resiOptions.map(({ value, label }) => (
                <button
                  key={value}
                  disabled={updating}
                  onClick={() => handleResiCheckChange(value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    (lead.resiCheck || "not") === value
                      ? "bg-black text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center mt-6">
              <div className="space-x-2">
                <button
                  onClick={handleCopy}
                  className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 transition"
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                </button>
                <button
                  onClick={handleCopyAddress}
                  className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 transition"
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Alamat"}
                </button>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm(`Hapus data atas nama ${lead.name}?`)) {
                    await deleteDoc(doc(db, "leads", lead.id));
                    setShowModal(false);
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm"
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
