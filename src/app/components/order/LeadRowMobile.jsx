// app/dashboard/LeadRowMobile.jsx
"use client";

import { useState, useCallback } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

// 🔹 Format currency short
const formatHargaSingkat = (harga) => {
  if (!harga) return "-";
  if (harga >= 1_000_000)
    return (harga / 1_000_000).toFixed(1).replace(".0", "") + "jt";
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

export default function LeadRowMobile({
  lead,
  copiedId,
  setCopiedId,
  onSelect,
}) {
  const [showModal, setShowModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showUpdateFields, setShowUpdateFields] = useState(false);

  const [priceValue, setPriceValue] = useState(lead.price || "");
  const [costProductValue, setCostProductValue] = useState(
    lead.costProduct || ""
  );
  const [addressValue, setAddressValue] = useState(lead.address || "");
  const [cleanAddressValue, setCleanAddressValue] = useState(
    lead.addressClean || ""
  );
  const [productTitleValue, setProductTitleValue] = useState(
    lead.productTitle || ""
  );
  const [ongkirValue, setOngkirValue] = useState(lead.ongkir || "");
  const [returnValue, setReturnValue] = useState(lead.rts || "");
  const [statusValue, setStatusValue] = useState(lead.status || "");
  const [resiCheckValue, setResiCheckValue] = useState(lead.resiCheck || "not");

  const handleCheckboxChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      setIsChecked(checked);
      onSelect?.(lead, checked);
    },
    [lead, onSelect]
  );

  // 🔹 Simpan semua perubahan
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
        addressClean: cleanAddressValue,
        rts: Number(returnValue) || 0,
        productTitle: productTitleValue,
        ongkir: Number(ongkirValue) || 0,
        status: statusValue,
        resiCheck: resiCheckValue,
      });
      setShowModal(false);
    } catch (err) {
      console.error("Gagal update:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Hapus data atas nama ${lead.name}?`)) {
      await deleteDoc(doc(db, "leads", lead.id));
      setShowModal(false);
    }
  };

  const handleCopyAddress = () => {
    const prompt = `Rapikan alamat mentah ini menjadi format administrasi Indonesia dengan struktur:
[PROVINSI], [KABUPATEN/KOTA], [KECAMATAN], [DESA/KELURAHAN], [KODE POS]
Sertakan juga "Alamat Lengkap" yang sudah rapi.

Contoh Output:
- Provinsi: ...
- Kabupaten/Kota: ...
- Kecamatan: ...
- Desa/Kelurahan: ...
- Kode Pos: ...
- Alamat Lengkap: ...

Alamat mentah: ${lead.address}`;

    copyToClipboard(prompt, () => {
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyOrder = () => {
    const pesan = `
Terima kasih sudah melakukan pemesanan 🙏  
Berikut detail pesanan Kakak:

Nama Produk: ${productTitleValue}  
Harga Produk: ${formatHargaSingkat(priceValue)}   
Ongkir: ~25rb~ 20rb
Total Pembayaran: 

Nama: ${lead.name}  
Alamat Lengkap: ${lead.address}

Apakah alamat yang Kakak berikan sudah benar?  
Kami akan segera proses pesanan Kakak jika alamatnya sudah sesuai ya.  
Untuk ongkir, akan dihitung otomatis dan dianggap disetujui oleh sistem 🙏
`;

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
              { day: "2-digit", month: "short" }
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
            statusValue === "complete"
              ? "text-green-500"
              : statusValue === "cancel"
              ? "text-red-500"
              : statusValue === "pending"
              ? "text-yellow-500"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {statusValue}
        </span>
        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
          {productTitleValue}
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500 dark:text-gray-400">Resi:</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              resiCheckValue === "done"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {resiCheckValue === "done" ? "✅ Dicek" : "❌ Belum"}
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-xl shadow-xl relative text-sm text-gray-800 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
            >
              ❌
            </button>
            <h2 className="text-xl font-semibold mb-4">📄 Detail Lead</h2>

            {/* Body */}
            <div className="space-y-2">
              <p>
                <strong>Nama:</strong> {lead.name}
              </p>
              <p>
                <strong>WA:</strong> {lead.whatsapp}
              </p>
              <div>
                <label className="block text-xs mb-1">Produk:</label>
                <input
                  type="text"
                  value={productTitleValue}
                  onChange={(e) => setProductTitleValue(e.target.value)}
                  className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Harga:</label>
                <input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Alamat:</label>
                <textarea
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  rows={3}
                  className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <button
                onClick={() => setShowUpdateFields(!showUpdateFields)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                {showUpdateFields ? "🔽 Tutup Update Data" : "🔼 Update Data"}
              </button>

              {showUpdateFields && (
                <>
                  <div>
                    <label className="block text-xs mb-1">Cost Product:</label>
                    <input
                      type="number"
                      value={costProductValue}
                      onChange={(e) => setCostProductValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Alamat Rapi:</label>
                    <textarea
                      value={cleanAddressValue}
                      onChange={(e) => setCleanAddressValue(e.target.value)}
                      rows={3}
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Ongkir:</label>
                    <input
                      type="number"
                      value={ongkirValue}
                      onChange={(e) => setOngkirValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  {statusValue === "rts" && (
                    <div>
                      <label className="block text-xs mb-1">Biaya RTS:</label>
                      <input
                        type="number"
                        value={returnValue}
                        onChange={(e) => setReturnValue(e.target.value)}
                        className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status & Resi Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusValue(s.value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    statusValue === s.value
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {resiOptions.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResiCheckValue(r.value)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    resiCheckValue === r.value
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Save & Copy Buttons */}
            <button
              onClick={handleSave}
              className="w-full mt-4 bg-black dark:bg-white dark:text-black text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              💾 Simpan Perubahan
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
      )}
    </>
  );
}
