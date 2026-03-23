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

export default function LeadRowMobile({
  lead,
  copiedId,
  setCopiedId,
  onSelect,
  products = [],
}) {
  const [showModal, setShowModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [nameValue, setNameValue] = useState(lead.name || "");
  const [whatsappValue, setWhatsappValue] = useState(lead.whatsapp || "");
  const [priceValue, setPriceValue] = useState(lead.price || "");
  const [costProductValue, setCostProductValue] = useState(
    lead.costProduct || "",
  );
  const [addressValue, setAddressValue] = useState(lead.address || "");
  const [cleanAddressValue, setCleanAddressValue] = useState(
    lead.addressClean || "",
  );
  const [productTitleValue, setProductTitleValue] = useState(
    lead.productTitle || "",
  );
  const [ongkirValue, setOngkirValue] = useState(lead.ongkir || "");
  const [returnValue, setReturnValue] = useState(lead.rts || "");
  const [confirmationValue, setConfirmationValue] = useState(
    lead.confirmation || "belum",
  );
  const [showAddressDetail, setShowAddressDetail] = useState(false);
  const [messageSentValue, setMessageSentValue] = useState(
    lead.messageSent ?? false,
  );

  // 🔥 NEW: product system
  const [selectedProductId, setSelectedProductId] = useState(
    lead.productId || "",
  );
  const [selectedUpsellId, setSelectedUpsellId] = useState(lead.upsellId || "");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // 🔥 update saat ganti product
  useEffect(() => {
    if (!selectedProduct) return;

    setProductTitleValue(selectedProduct.title);
    setPriceValue(selectedProduct.pricing.price);
    setCostProductValue(selectedProduct.pricing.cost);

    setSelectedUpsellId("");
  }, [selectedProductId]);

  // 🔥 update upsell
  useEffect(() => {
    if (!selectedProduct) return;

    let price = selectedProduct.pricing.price;
    let cost = selectedProduct.pricing.cost;
    let title = selectedProduct.title;

    if (selectedUpsellId) {
      const upsell = selectedProduct.upsells.find(
        (u) => u.id === selectedUpsellId,
      );

      if (upsell) {
        price += upsell.price;
        cost += upsell.cost;
        title = `${selectedProduct.title} + ${upsell.title}`;
      }
    }

    setPriceValue(price);
    setCostProductValue(cost);
    setProductTitleValue(title);
  }, [selectedUpsellId, selectedProductId]);

  const handleMessageSentChange = useCallback(
    async (value) => {
      try {
        await updateDoc(doc(db, "leads", lead.id), {
          messageSent: value,
        });
        setMessageSentValue(value);
      } catch (err) {
        console.error(err);
        alert("Gagal update messageSent.");
      }
    },
    [lead],
  );
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

  useEffect(() => {
    if (showModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
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
        productId: selectedProductId,
        upsellId: selectedUpsellId || null,

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
        console.error(err);
        alert("Gagal update status.");
      }
    },
    [lead],
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
        console.error(err);
        alert("Gagal update konfirmasi.");
      }
    },
    [lead],
  );

  const handleResiCheckChange = useCallback(
    async (newResiCheck) => {
      if (newResiCheck === lead.resiCheck) return;
      try {
        await updateDoc(doc(db, "leads", lead.id), { resiCheck: newResiCheck });
      } catch (err) {
        console.error(err);
        alert("Gagal update resiCheck.");
      }
    },
    [lead],
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
Alamat Lengkap: ${lead.addressClean}

Apakah alamat yang Kakak berikan sudah benar?  
Kami akan segera proses pesanan Kakak jika alamatnya sudah sesuai ya🙏 

Untuk ongkir, akan dihitung otomatis dan dianggap disetujui oleh sistem.
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

  return (
    <>
      {/* CARD STYLE MOBILE */}
      <div
        className="bg-gray-50 dark:bg-gray-900  rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        onClick={() => setShowModal(true)}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs">
            {lead.name}
          </h3>
          <input
            type="checkbox"
            checked={isChecked}
            onClick={(e) => e.stopPropagation()}
            onChange={handleCheckboxChange}
            className="scale-100 accent-gray-700 dark:accent-gray-300"
          />
        </div>
        <p className="text-xs text-gray-500 ">{lead.whatsapp}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {lead.productTitle}
        </p>
        <div className="flex justify-between text-xs ">
          <span
            className={`font-semibold ${
              lead.status === "complete"
                ? "text-green-600"
                : lead.status === "cancel"
                  ? "text-red-600"
                  : lead.status === "pending"
                    ? "text-yellow-600"
                    : "text-gray-600"
            }`}
          >
            {lead.status.toUpperCase()}
          </span>
          <span>{lead.confirmation === "sudah" ? "🟢" : "🔴"}</span>
        </div>
      </div>

      {/* FULLSCREEN MOBILE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-t-2xl p-5 overflow-y-auto h-full">
            <div className="flex justify-between items-center ">
              <h2 className="text-lg font-bold dark:text-white">
                📄 Detail Lead
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-xl"
              >
                ✖
              </button>
            </div>

            <div className="text-sm dark:text-white">
              <div>
                <label>Nama</label>
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-full border rounded px-1 py-2 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <label>No WhatsApp</label>
                <input
                  value={whatsappValue}
                  onChange={(e) => setWhatsappValue(e.target.value)}
                  className="w-full border rounded px-1 py-2  bg-gray-50 dark:bg-gray-800"
                />
                {/* Tombol direct ke WhatsApp */}
                {whatsappValue && (
                  <a
                    href={`https://wa.me/${whatsappValue.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-green-600 underline"
                  >
                    💬 Chat WA
                  </a>
                )}
              </div>
              {/* PRODUCT */}
              <div>
                <h3 className="font-bold text-sm mb-2">Product</h3>

                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`border p-2 mb-2 rounded ${
                      selectedProductId === p.id ? "bg-gray-200" : ""
                    }`}
                  >
                    {p.title}
                  </div>
                ))}
                {/* UPSELL */}
                {selectedProduct?.upsells?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm mt-4">Upsell</h3>

                    <div onClick={() => setSelectedUpsellId("")}>
                      ❌ No Upsell
                    </div>

                    {selectedProduct.upsells.map((u) => (
                      <div key={u.id} onClick={() => setSelectedUpsellId(u.id)}>
                        {u.title} (+{formatHargaSingkat(u.price)})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label>Harga</label>
                  <input
                    type="number"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className="w-full border rounded px-2 py-2  bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label>Cost Product</label>
                  <input
                    type="number"
                    value={costProductValue}
                    onChange={(e) => setCostProductValue(e.target.value)}
                    className="w-full border rounded px-2 py-2  bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label>Alamat Rapi</label>
                <textarea
                  value={cleanAddressValue}
                  onChange={(e) => setCleanAddressValue(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-2 py-2  bg-gray-50 dark:bg-gray-800"
                />
              </div>

              <div>
                <button
                  onClick={handleSave}
                  className="w-full bg-black text-white py-2 rounded-lg"
                >
                  💾 Simpan
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500">
                📦 Status
              </label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg 
    border border-gray-300 dark:border-gray-700 
    bg-gray-50 dark:bg-gray-800"
              >
                {statusOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 dark:text-white">
              {resiOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleResiCheckChange(value)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    (lead.resiCheck || "not") === value
                      ? "bg-black text-white"
                      : "border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4 dark:text-white">
              <button
                onClick={() => handleConfirmationChange("sudah")}
                className={`px-3 py-1 rounded-full text-xs ${
                  confirmationValue === "sudah"
                    ? "bg-green-600 text-white"
                    : "border border-gray-400"
                }`}
              >
                ✅ Sudah
              </button>
              <button
                onClick={() => handleConfirmationChange("belum")}
                className={`px-3 py-1 rounded-full text-xs ${
                  confirmationValue === "belum"
                    ? "bg-red-600 text-white"
                    : "border border-gray-400"
                }`}
              >
                ❌ Belum
              </button>
            </div>

            <div className="flex gap-2 mt-3 dark:text-white">
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Bot Message</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMessageSentChange(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      messageSentValue
                        ? "bg-green-600 text-white"
                        : "border-gray-300 hover:bg-green-50"
                    }`}
                  >
                    🟢
                  </button>
                  <button
                    onClick={() => handleMessageSentChange(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      !messageSentValue
                        ? "bg-red-600 text-white"
                        : "border-gray-300 hover:bg-red-50"
                    }`}
                  >
                    🔴
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-black text-white text-xs px-3 py-1 rounded-lg"
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                </button>
                <button
                  onClick={handleCopyAddress}
                  className="bg-black text-white text-xs px-3 py-1 rounded-lg"
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
                className="text-red-600 text-sm"
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
