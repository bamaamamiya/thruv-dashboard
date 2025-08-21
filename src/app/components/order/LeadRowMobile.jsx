// app/dashboard/LeadRowMobile.jsx
"use client";

import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient"; // sesuaikan alias path

const formatHargaSingkat = (harga) => {
  if (!harga) return "-";
  if (harga >= 1_000_000)
    return (harga / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  return (harga / 1000).toFixed(0) + "rb";
};

export default function LeadRowMobile({
  lead,
  copiedId,
  setCopiedId,
  onSelect,
}) {
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [formData, setFormData] = useState({
    costProduct: lead.costProduct || "",
    price: lead.price || "",
    status: lead.status || "",
    resiCheck: lead.resiCheck || "not",
    rts: lead.rts || "",
    address: lead.address || "",
  });

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    onSelect?.(lead, checked);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyAddress = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    const prompt = `[PROVINSI], [KABUPATEN/KOTA], [KECAMATAN], [DESA/KELURAHAN] dan rapikan alamat lengkap, dan kelurahan/desa terpisah.\n\nAlamat mentah: ${lead.address}`;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Gagal salin alamat:", err);
      alert("Gagal menyalin alamat.");
    }
  };

  const handleCopyOrder = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
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
    try {
      await navigator.clipboard.writeText(pesan);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Gagal salin order:", err);
      alert("Gagal menyalin pesan order.");
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      // biarkan kosong/null tetap tersimpan
      await updateDoc(doc(db, "leads", lead.id), {
        price: formData.price ? Number(formData.price) : null,
        costProduct: formData.costProduct ? Number(formData.costProduct) : null,
        status: formData.status || "",
        resiCheck: formData.resiCheck || "not",
        rts: formData.rts ? Number(formData.rts) : null,
        address: formData.address || "",
      });
      setShowModal(false);
    } catch (err) {
      console.error("Gagal update:", err);
      alert("Gagal menyimpan data.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Hapus data atas nama ${lead.name}?`)) {
      await deleteDoc(doc(db, "leads", lead.id));
      setShowModal(false);
    }
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
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
        className="scale-125"
      />
      <div
        onClick={() => setShowModal(true)}
        className="rounded-xl p-4 mb-4 shadow-sm hover:ring ring-gray-200 dark:hover:ring-gray-700 transition cursor-pointer bg-white dark:bg-gray-900"
      >
        <div className="flex justify-between text-sm mb-2 text-gray-400 dark:text-gray-500">
          <span>
            {new Date(lead.createdAt.seconds * 1000).toLocaleDateString(
              "id-ID",
              {
                day: "2-digit",
                month: "short",
              }
            )}
          </span>
          <span className="text-emerald-500 font-medium">
            {lead.paymentMethod}
          </span>
        </div>
        <div className="text-gray-800 dark:text-gray-100 font-semibold text-base">
          {lead.name}
        </div>
        <div className="text-blue-600 dark:text-blue-400 text-sm mb-1">
          {lead.whatsapp}
        </div>
        <span
          className={`text-sm font-medium capitalize rounded px-2 py-0.5 inline-block mt-1 ${
            lead.status === "complete"
              ? "text-green-500"
              : lead.status === "cancel"
              ? "text-red-500"
              : lead.status === "pending"
              ? "text-yellow-500"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {lead.status || "None"}
        </span>
        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {lead.productTitle}
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500 dark:text-gray-400">Resi:</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              lead.resiCheck === "done"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {lead.resiCheck === "done" ? "✅ Dicek" : "❌ Belum"}
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-xl shadow-xl relative text-sm text-gray-800 dark:text-gray-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
              aria-label="Close modal"
            >
              ❌
            </button>

            <h2 className="text-xl font-semibold mb-4">📄 Detail Order</h2>

            <div className="space-y-2">
              <p>
                <span className="text-gray-500 dark:text-gray-400">Nama:</span>{" "}
                {lead.name}
              </p>
              <p>
                <span className="text-gray-500 dark:text-gray-400">WA:</span>{" "}
                <a
                  href={`https://wa.me/${lead.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {lead.whatsapp}
                </a>
              </p>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Harga:
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Alamat:
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <p>
                <span className="text-gray-500 dark:text-gray-400">Produk:</span>{" "}
                {lead.productTitle}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Cost Product:
                </label>
                <input
                  type="number"
                  value={formData.costProduct}
                  onChange={(e) => handleChange("costProduct", e.target.value)}
                  className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs mb-1">
                  Biaya RTS:
                </label>
                <input
                  type="number"
                  value={formData.rts}
                  onChange={(e) => handleChange("rts", e.target.value)}
                  className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Masukkan biaya RTS"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    disabled={updating}
                    onClick={() => handleChange("status", s.value)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      formData.status === s.value
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {resiOptions.map((r) => (
                  <button
                    key={r.value}
                    disabled={updating}
                    onClick={() => handleChange("resiCheck", r.value)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      formData.resiCheck === r.value
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={updating}
                className="w-full bg-black dark:bg-white dark:text-black text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition"
              >
                {updating ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
              </button>

              <div className="flex justify-between items-center mt-4">
                <div className="space-x-2">
                  <button
                    onClick={handleCopyOrder}
                    className="bg-black dark:bg-white dark:text-black text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                  </button>
                  <button
                    onClick={handleCopyAddress}
                    className="bg-black dark:bg-white dark:text-black text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Alamat"}
                  </button>
                </div>
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-600 text-sm flex"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
