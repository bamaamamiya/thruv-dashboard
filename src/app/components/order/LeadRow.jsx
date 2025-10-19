"use client";

import { useState, useCallback, useEffect } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getOngkirNormal } from "@/utils/ongkir";

const formatHargaSingkat = (harga) => {
  if (!harga) return "-";
  if (harga >= 1_000_000)
    return (harga / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  return (harga / 1000).toFixed(0) + "rb";
};

const copyToClipboard = async (text, onCopied) => {
  if (typeof navigator === "undefined") return;
  try {
    await navigator.clipboard.writeText(text);
    onCopied?.();
  } catch (err) {
    console.error(err);
    alert("Gagal menyalin teks.");
  }
};

export default function LeadRow({ lead, copiedId, setCopiedId, onSelect }) {
  const [showModal, setShowModal] = useState(false);
  const [showAddressDetail, setShowAddressDetail] = useState(false);
  const [nameValue, setNameValue] = useState(lead.name || "");
  const [whatsappValue, setWhatsappValue] = useState(lead.whatsapp || "");
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
  const [ongkirValue, setOngkirValue] = useState(lead.ongkir || "");
  const [confirmationValue, setConfirmationValue] = useState(
    lead.confirmation || "belum"
  );

  const [customerConfirmedValue, setCustomerConfirmedValue] = useState(
    lead.customerConfirmed ?? false
  );

  // 🔒 Matikan scroll body saat modal terbuka
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showModal]);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    onSelect?.(lead, checked);
  };

  const handleSave = async () => {
    if (!priceValue || !costProductValue) {
      alert("Harga dan biaya produk tidak boleh kosong.");
      return;
    }
    try {
      await updateDoc(doc(db, "leads", lead.id), {
        name: nameValue,
        whatsapp: whatsappValue,
        price: Number(priceValue),
        costProduct: Number(costProductValue),
        address: addressValue,
        addressClean: cleanAddressValue,
        productTitle: productTitleValue,
        ongkir: Number(ongkirValue) || 0,
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
        lead.status = newStatus;
      } catch (err) {
        console.error("Gagal update status:", err);
        alert("Gagal update status.");
      }
    },
    [lead]
  );

  const handleConfirmationChange = useCallback(
    async (newConfirmation) => {
      if (newConfirmation === lead.confirmation) return;
      try {
        await updateDoc(doc(db, "leads", lead.id), {
          confirmation: newConfirmation,
        });
        lead.confirmation = newConfirmation;
        setConfirmationValue(newConfirmation);
      } catch (err) {
        console.error("Gagal update konfirmasi:", err);
        alert("Gagal update konfirmasi.");
      }
    },
    [lead]
  );
  const handleCustomerConfirmedChange = useCallback(
    async (newValue) => {
      try {
        await updateDoc(doc(db, "leads", lead.id), {
          customerConfirmed: newValue,
        });
        lead.customerConfirmed = newValue; // update local object
        setCustomerConfirmedValue(newValue); // update state UI
      } catch (err) {
        console.error("Gagal update customerConfirmed:", err);
        alert("Gagal update konfirmasi customer.");
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

  const handleCopy = () => {
    const ongkirNormal = getOngkirNormal(ongkirValue);
    const totalPayment = priceValue + ongkirValue;
    const pesan = `
Terima kasih sudah melakukan pemesanan 🙏  
Berikut detail pesanan Kakak:

Nama Produk: ${productTitleValue}  
Harga Produk: ${formatHargaSingkat(priceValue)}   
Ongkir: ~${formatHargaSingkat(ongkirNormal)}~ ${formatHargaSingkat(ongkirValue)}
Total Pembayaran: ${formatHargaSingkat(totalPayment)}

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

Alamat mentah: ${cleanAddressValue}`;

    copyToClipboard(prompt, () => {
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
        className="grid text-sm grid-cols-9 items-center gap-2 cursor-pointer 
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

        <span className="text-lg text-center">
          {lead.confirmation === "sudah" ? "🟢" : "🔴"}
        </span>

        <span className="text-lg text-center">
          {lead.resiCheck === "done" ? "✅" : "❌"}
        </span>

        {/* <span className="text-lg text-center">
          {lead.confirmation === "sudah" ? "🟢" : "🔴"}
        </span> */}
      </div>

      {/* Modal full update */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative text-gray-800 dark:text-gray-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white text-xl"
            >
              ❌
            </button>
            <h2 className="text-xl font-bold mb-2">📄 Detail Lead</h2>

            <div className="space-y-3">
              <div>
                <label className="font-medium text-sm">Nama</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-sm">Nomor WhatsApp</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                  value={whatsappValue}
                  onChange={(e) => setWhatsappValue(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-sm">Produk</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                    value={productTitleValue}
                    onChange={(e) => setProductTitleValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-sm">Harga</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-sm">Cost Product</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                    value={costProductValue}
                    onChange={(e) => setCostProductValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-sm">Biaya Ongkir</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                    value={ongkirValue}
                    onChange={(e) => setOngkirValue(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-medium text-sm">Alamat Rapi</label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                    rows={3}
                    value={cleanAddressValue}
                    onChange={(e) => setCleanAddressValue(e.target.value)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddressDetail(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    📍 Lihat detail wilayah
                  </button>
                </div>

                {lead.status === "rts" && (
                  <div>
                    <label className="font-medium text-sm">Biaya Return</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800"
                      value={returnValue}
                      onChange={(e) => setReturnValue(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {showAddressDetail && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-xl w-[90%] max-w-sm text-sm">
                    <h3 className="font-bold mb-2 text-lg">
                      📍 Detail Wilayah
                    </h3>
                    <ul className="space-y-1">
                      <li>
                        <strong>Provinsi:</strong> {lead.province || "-"}
                      </li>
                      <li>
                        <strong>Kabupaten/Kota:</strong> {lead.regency || "-"}
                      </li>
                      <li>
                        <strong>Kecamatan:</strong> {lead.district || "-"}
                      </li>
                      <li>
                        <strong>Desa/Kelurahan:</strong> {lead.village || "-"}
                      </li>
                      <li>
                        <strong>Kode Pos:</strong> {lead.postalCode || "-"}
                      </li>
                    </ul>
                    <button
                      onClick={() => setShowAddressDetail(false)}
                      className="mt-4 bg-black dark:bg-gray-700 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-gray-800 dark:hover:bg-gray-600"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Masuk:{" "}
                {new Date(lead.createdAt.seconds * 1000).toLocaleString(
                  "id-ID"
                )}
              </p>

              <button
                onClick={handleSave}
                className="w-full bg-black dark:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                💾 Simpan Perubahan
              </button>
            </div>

            {/* Status & Resi */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
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
            <div className="flex flex-wrap gap-2 mt-2">
              {resiOptions.map(({ value, label }) => (
                <button
                  key={value}
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
            <div className="flex gap-2">
              {/* Konfirmasi */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleConfirmationChange("sudah")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    confirmationValue === "sudah"
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"
                  }`}
                >
                  ✅ Sudah
                </button>
                <button
                  onClick={() => handleConfirmationChange("belum")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    confirmationValue === "belum"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-800"
                  }`}
                >
                  ❌ belum
                </button>
              </div>

              {/* Konfirmasi Customer */}
              {/* <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleCustomerConfirmedChange(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    customerConfirmedValue
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"
                  }`}
                >
                  ✅ Customer
                </button>
                <button
                  onClick={() => handleCustomerConfirmedChange(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition border ${
                    !customerConfirmedValue
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-800"
                  }`}
                >
                  ❌ Customer
                </button>
              </div> */}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-black dark:bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                </button>
                <button
                  onClick={handleCopyAddress}
                  className="bg-black dark:bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
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
