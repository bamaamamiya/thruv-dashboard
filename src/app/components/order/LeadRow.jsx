"use client";

import { useState, useCallback, useEffect } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getOngkirNormal } from "@/utils/ongkir";
import { resolveProduct } from "@/utils/productResolver";
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

export default function LeadRow({
  lead,
  copiedId,
  setCopiedId,
  onSelect,
  selectedLeads,
  products,
}) {
  const [showModal, setShowModal] = useState(false);

  // ----- LEAD FIELDS -----
  const [nameValue, setNameValue] = useState(lead.name || "");
  const [whatsappValue, setWhatsappValue] = useState(lead.whatsapp || "");
  const [priceValue, setPriceValue] = useState(lead.price || 0);
  const [costProductValue, setCostProductValue] = useState(
    lead.costProduct || 0,
  );
  const [addressValue, setAddressValue] = useState(lead.address || "");
  const [cleanAddressValue, setCleanAddressValue] = useState(
    lead.addressClean || "",
  );
  const [productTitleValue, setProductTitleValue] = useState(
    lead.productTitle || "",
  );
  const [ongkirValue, setOngkirValue] = useState(lead.ongkir || 0);
  const [returnValue, setReturnValue] = useState(lead.rts || 0);
  const [confirmationValue, setConfirmationValue] = useState(
    lead.confirmation || "belum",
  );

  const [selectedProductId, setSelectedProductId] = useState(
    lead.productId || "",
  );
  const [selectedUpsellId, setSelectedUpsellId] = useState(lead.upsellId || "");
  const [selectedUpsellSnapshot, setSelectedUpsellSnapshot] = useState(
    lead.selectedUpsell || null,
  );
  const [showAddressDetail, setShowAddressDetail] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // ---- UPDATE PRODUCT & UPSSELL SNAPSHOT ----
  useEffect(() => {
    if (!selectedProduct) return;

    let price = selectedProduct.pricing.price;
    let cost = selectedProduct.pricing.cost;
    let title = selectedProduct.title;
    let snapshot = null;

    if (selectedUpsellId) {
      const upsell = selectedProduct.upsells.find(
        (u) => u.id === selectedUpsellId,
      );
      if (upsell) {
        price += upsell.price;
        cost += upsell.cost;
        title = `${selectedProduct.title} + ${upsell.title}`;
        snapshot = { ...upsell }; // snapshot add-on
      }
    }

    setProductTitleValue(title);
    setPriceValue(price);
    setCostProductValue(cost);
    setSelectedUpsellSnapshot(snapshot);
  }, [selectedProductId, selectedUpsellId, selectedProduct]);

  // ----- MODAL SCROLL LOCK -----
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [showModal]);

  const isChecked = selectedLeads?.some((l) => l.id === lead.id);

  const handleCheckboxChange = (e) => {
    onSelect?.(lead, e.target.checked);
  };

  // 🔒 Matikan scroll body saat modal terbuka
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [showModal]);

  const handleSave = async () => {
    if (!priceValue || !costProductValue) {
      alert("Harga dan biaya produk tidak boleh kosong.");
      return;
    }

    try {
      await updateDoc(doc(db, "leads", lead.id), {
        productId: selectedProductId,
        upsellId: selectedUpsellId || null,
        selectedUpsell: selectedUpsellSnapshot || null, // snapshot for history
        name: nameValue,
        whatsapp: whatsappValue,
        price: Number(priceValue),
        costProduct: Number(costProductValue),
        addressClean: cleanAddressValue,
        productTitle: productTitleValue,
        ongkir: Number(ongkirValue) || 0,
        rts: Number(returnValue) || 0,
        confirmation: confirmationValue,
        queuedForMessage: false, // 🚫 jangan auto kirim ulang
      });
      setShowModal(false);
    } catch (err) {
      console.error("Gagal update lead:", err);
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
    [lead],
  );

  const handleStateChange = useCallback(
    async (newState) => {
      if (newState === lead.state) return;

      let queued = false;

      // 🔥 hanya trigger kalau state butuh kirim message
      if (["WAITING_CONFIRMATION", "WAITING_UPSELL"].includes(newState)) {
        queued = true;
      }

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          state: newState,
          queuedForMessage: queued,
          nextSendAt: new Date(),
        });
      } catch (err) {
        console.error("Gagal update state:", err);
        alert("Gagal update state.");
      }
    },
    [lead],
  );

  const handleConfirmationChange = useCallback(
    async (newConfirmation) => {
      if (newConfirmation === confirmationValue) return;

      let newState = lead.state;

      // 🔥 mapping logic
      if (newConfirmation === "sudah") {
        newState = "WAITING_UPSELL";
      } else if (newConfirmation === "belum") {
        newState = "WAITING_CONFIRMATION";
      }

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          confirmation: newConfirmation,
          state: newState,

          // 🔥 trigger ulang worker
          queuedForMessage: true,
          nextSendAt: new Date(),
        });

        setConfirmationValue(newConfirmation);
      } catch (err) {
        console.error("Gagal update konfirmasi:", err);
        alert("Gagal update konfirmasi.");
      }
    },
    [lead, confirmationValue],
  );

  useEffect(() => {
    setConfirmationValue(lead.confirmation || "belum");
  }, [lead.confirmation]);

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
    [lead],
  );

  const handleCopy = () => {
    const price = Number(priceValue) || 0;
    const ongkir = Number(ongkirValue) || 0;

    const ongkirNormal = getOngkirNormal(ongkirValue);
    const totalPayment = price + ongkir;
    const pesan = `
Pesanan Kakak sudah berhasil kami terima.
  
Berikut detail pesanan Kakak:

Nama Produk: ${productTitleValue}  
Harga Produk: ${formatHargaSingkat(price)}   
Ongkir: ~${formatHargaSingkat(ongkirNormal)}~ ${formatHargaSingkat(ongkir)}
Total Pembayaran: ${formatHargaSingkat(totalPayment)}

Nama: ${lead.name}  
Alamat Lengkap: ${lead.addressClean}

Pesanan akan segera diproses sesuai data yang telah dikirim saat checkout.

Terima kasih sudah pesan di toko kami 🙏
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
  const stateOptions = [
    { value: "WAITING_CONFIRMATION", label: "🟡 Waiting Confirmation" },
    { value: "WAITING_UPSELL", label: "🟠 Waiting Upsell" },
    { value: "DONE", label: "✅ Done" },
  ];
  const isMessageSynced = lead.lastMessageState === lead.state;
  const isMessageState = lead.state;
  const isMessagePending = lead.queuedForMessage;

  return (
    <>
      {/* Lead Row */}
      <div
        className="grid grid-cols-10 items-center gap-1 cursor-pointer 
  hover:bg-gray-50 dark:hover:bg-gray-700 
  px-2 py-1.5 rounded-md transition 
  bg-gray-50 dark:bg-black text-xs"
        onClick={() => setShowModal(true)}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="scale-100 accent-gray-800 dark:accent-gray-200"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(lead.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
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
          className={`uppercase font-semibold text-xs text-center ${
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

        <span className="text-sm text-center">
          {lead.confirmation === "sudah" ? "🟢" : "🔴"}
        </span>

        <span className="text-sm text-center">
          {lead.resiCheck === "done" ? "✅" : "❌"}
        </span>

        <span className="text-sm text-center">
          {lead.aiMode === "human" ? "🔴" : "🤖"}
        </span>

        {/* <span className="text-lg text-center">
          {lead.confirmation === "sudah" ? "🟢" : "🔴"}
        </span> */}
      </div>

      {/* Modal full update */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ">
          <div className="bg-gray-50 dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl p-2 h-full text-gray-800 dark:text-gray-200 overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white text-xl"
            >
              ❌
            </button>

            <div>
              <h2 className="text-xl font-bold mb-2">📄 Detail Lead</h2>
              <div>
                <label className="font-medium text-xs">Nama</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-xs">Nomor WhatsApp</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                  value={whatsappValue}
                  onChange={(e) => setWhatsappValue(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="space-y-4">
                    {/* PRODUCT */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">
                        Product
                      </label>

                      <div className="space-y-2">
                        {products.map((p) => {
                          const active = selectedProductId === p.id;

                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedProductId(p.id)}
                              className={`border rounded-lg px-3 py-2 cursor-pointer transition
            ${
              active
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:bg-gray-50"
            }
            `}
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">{p.title}</p>
                                <p className="text-xs text-gray-500">
                                  {formatHargaSingkat(p.pricing.price)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* UPSELL */}
                    {selectedProduct?.upsells?.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">
                          Add-ons (Optional)
                        </label>

                        <div className="space-y-2">
                          {/* no upsell */}
                          <div
                            onClick={() => setSelectedUpsellId("")}
                            className={`border rounded-lg px-3 py-2 cursor-pointer transition
          ${
            selectedUpsellId === ""
              ? "border-black bg-gray-50"
              : "border-gray-200 hover:bg-gray-50"
          }
          `}
                          >
                            <p className="text-sm">No add-on</p>
                          </div>

                          {selectedProduct.upsells.map((u) => {
                            const active = selectedUpsellId === u.id;

                            return (
                              <div
                                key={u.id}
                                onClick={() => setSelectedUpsellId(u.id)}
                                className={`border rounded-lg px-3 py-2 cursor-pointer transition
              ${
                active
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:bg-gray-50"
              }
              `}
                              >
                                <div className="flex justify-between">
                                  <p className="text-sm">{u.title}</p>
                                  <p className="text-xs text-gray-500">
                                    +{formatHargaSingkat(u.price)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-medium text-xs">Harga</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                    value={priceValue}
                    onChange={(e) => setPriceValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-medium text-xs">Cost Product</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                    value={costProductValue}
                    onChange={(e) => setCostProductValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-xs">Biaya Ongkir</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                    value={ongkirValue}
                    onChange={(e) => setOngkirValue(Number(e.target.value))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-medium text-xs">Alamat Rapi</label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                    rows={2}
                    value={cleanAddressValue}
                    onChange={(e) => setCleanAddressValue(e.target.value)}
                  />
                </div>

                {lead.status === "rts" && (
                  <div>
                    <label className="font-medium text-xs">Biaya Return</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-2 text-xs bg-gray-50 dark:bg-gray-800"
                      value={returnValue}
                      onChange={(e) => setReturnValue(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {showAddressDetail && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                  <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl shadow-xl w-[90%] max-w-sm text-xs">
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

              <button
                onClick={handleSave}
                className="w-full bg-black dark:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                💾 Simpan Perubahan
              </button>
            </div>

            {/* STATUS ORDER */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500">
                📦 Order Status
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

            {/* RESI */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500">
                🚚 Resi Check
              </label>
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
            </div>

            {/* COMMUNICATION */}
            <div className="mt-4 space-y-3">
              {/* Customer Confirm */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer Confirm</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmationChange("sudah")}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      confirmationValue === "sudah"
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    ✅ Sudah
                  </button>

                  <button
                    onClick={() => handleConfirmationChange("belum")}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      confirmationValue === "belum"
                        ? "bg-red-600 text-white border-red-600"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    ❌ Belum
                  </button>
                </div>
              </div>

              {/* AI MODE */}
              <div>
                <p className="text-xs text-gray-500 mb-1">AI Mode</p>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await updateDoc(doc(db, "leads", lead.id), {
                        aiMode: "human",
                        aiFallbackCount: 0,
                      });
                    }}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      lead.aiMode === "human"
                        ? "bg-red-600 text-white border-red-600"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    🙋 Ambil Alih
                  </button>

                  <button
                    onClick={async () => {
                      await updateDoc(doc(db, "leads", lead.id), {
                        aiMode: "auto",
                        aiFallbackCount: 0,
                      });
                    }}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      lead.aiMode === "auto" || !lead.aiMode
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    🤖 Kembalikan ke AI
                  </button>
                </div>

                {lead.aiMode === "human" && (
                  <p className="text-[10px] text-red-500 mt-1">
                    AI diam — CS sedang handle
                  </p>
                )}
              </div>

              {/* Bot State */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Bot State</p>

                <select
                  value={lead.state || ""}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                >
                  {stateOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Sync */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Message Sync</p>

                <div
                  className={`inline-block px-3 py-1 text-xs rounded-md ${
                    isMessageSynced
                      ? "bg-green-600 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {isMessageSynced ? "✅ Sent" : "⏳ Pending"}
                </div>

                <p className="text-[10px] text-gray-400 mt-1">
                  Last: {lead.lastMessageState || "-"}
                </p>
              </div>
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
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
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
