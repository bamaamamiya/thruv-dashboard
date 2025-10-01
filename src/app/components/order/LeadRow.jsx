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
  const [cleanAddressValue, setCleanAddressValue] = useState(
    lead.addressClean || ""
  );
  const [productTitleValue, setProductTitleValue] = useState(
    lead.productTitle || ""
  );

  const [showCleanAddress, setShowCleanAddress] = useState(false);
  const [ongkirValue, setOngkirValue] = useState(lead.ongkir || "");
  const [showUpdateFields, setShowUpdateFields] = useState(false);

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
  const savingCleanAddress = useDebouncedSave(
    cleanAddressValue,
    lead.addressClean,
    lead.id,
    "cleanAddress"
  );
  const savingProductTitle = useDebouncedSave(
    productTitleValue,
    lead.productTitle,
    lead.id,
    "productTitle"
  );
  const savingOngkir = useDebouncedSave(
    ongkirValue,
    lead.ongkir,
    lead.id,
    "ongkir"
  );

  const savingReturn = useDebouncedSave(returnValue, lead.rts, lead.id, "rts");

  const updating =
    savingPrice ||
    savingCost ||
    savingAddress ||
    savingReturn ||
    savingCleanAddress ||
    savingProductTitle ||
    savingOngkir;

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

  const handleCopy = () => {
    const pesan = `Terima kasih sudah melakukan pemesanan 🙏  
Berikut detail pesanan Kakak:

Nama Produk: ${lead.productTitle}  
Harga Produk: ${formatHargaSingkat(lead.price)}  
Ongkir: 20rb
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
        className="grid text-sm grid-cols-8 items-center gap-2 cursor-pointer 
             hover:bg-gray-50 dark:hover:bg-gray-700 
             px-3 py-3 rounded-md transition 
             border border-gray-200 dark:border-gray-700
             bg-white dark:bg-black"
        onClick={() => setShowModal(true)}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select lead"
          className="scale-125 accent-gray-800 dark:accent-gray-200"
        />
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
        <span className="text-green-600 dark:text-green-400 font-medium text-center">
          {lead.paymentMethod}
        </span>
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {lead.productTitle}
        </span>
        <span
          className={`uppercase font-semibold text-sm text-center ${
            lead.status === "complete"
              ? "text-green-600 dark:text-green-400"
              : lead.status === "cancel"
              ? "text-red-600 dark:text-red-400"
              : lead.status === "pending"
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {lead.status}
        </span>

        <span
          className={`text-xs text-center font-semibold px-2 py-0.5 rounded-full ${
            lead.resiCheck === "done"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {lead.resiCheck === "done" ? "✅ Dicek" : "❌ Belum"}
        </span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-xl shadow-xl relative text-sm text-gray-800 dark:text-gray-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white text-xl"
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
                <strong>WA: </strong>
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
                <strong>Produk:</strong>
                <input
                  type="text"
                  className="border rounded px-2 py-1 text-sm w-full mt-1 
               bg-white dark:bg-gray-800 dark:border-gray-600 
               dark:text-gray-100"
                  value={productTitleValue}
                  onChange={(e) => setProductTitleValue(e.target.value)}
                  placeholder="Masukkan nama produk"
                />
              </div>

              <div>
                <strong>Harga Produk:</strong>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Masukkan harga jual terbaru"
                />
              </div>

              <div>
                <strong>Alamat:</strong>
                <textarea
                  className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  placeholder="Masukkan alamat baru"
                  rows={3}
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
                    <strong>Cost Product:</strong>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      value={costProductValue}
                      onChange={(e) => setCostProductValue(e.target.value)}
                      placeholder="Masukkan cost product"
                    />
                  </div>

                  <div>
                    <strong>Alamat Rapi:</strong>
                    <textarea
                      className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      value={cleanAddressValue}
                      onChange={(e) =>
                        setCleanAddressValuessValue(e.target.value)
                      }
                      placeholder="Masukkan alamat Rapi"
                      rows={3}
                    />
                  </div>

                  <div>
                    <strong>Biaya Ongkir:</strong>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      value={ongkirValue}
                      onChange={(e) => setOngkirValue(e.target.value)}
                      placeholder="Masukkan biaya ongkir"
                    />
                  </div>

                  {lead.status === "rts" && (
                    <div>
                      <strong>Biaya Return:</strong>
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-sm w-full mt-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        value={returnValue}
                        onChange={(e) => setReturnValue(e.target.value)}
                        placeholder="Masukkan biaya RTS"
                      />
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Masuk:{" "}
                {new Date(lead.createdAt.seconds * 1000).toLocaleString(
                  "id-ID"
                )}
              </p>

              <button
                onClick={handleSave}
                disabled={updating}
                className="w-full bg-gray-900 dark:bg-gray-700 text-white 
             text-xs font-semibold px-3 py-2 rounded-md 
             hover:bg-gray-800 dark:hover:bg-gray-600 transition"
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
                      ? "bg-black dark:bg-gray-700 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                      ? "bg-black dark:bg-gray-700 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="bg-gray-900 dark:bg-gray-700 text-white 
             text-xs font-semibold px-3 py-1 rounded-md 
             hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                </button>

                <button
                  onClick={handleCopyAddress}
                  className="bg-black dark:bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 transition"
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
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
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
