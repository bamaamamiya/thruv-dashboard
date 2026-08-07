"use client";

import { useState, useCallback, useEffect } from "react";
import { deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebaseClient";
import { getOngkirNormal } from "@/utils/ongkir";

const formatHargaSingkat = (harga) => {
  if (!harga) return "-";

  if (harga >= 1_000_000) {
    return (harga / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  }

  return (harga / 1000).toFixed(0) + "rb";
};

const copyToClipboard = async (text, onCopied) => {
  if (typeof navigator === "undefined") return;

  try {
    await navigator.clipboard.writeText(text);
    onCopied?.();
  } catch (err) {
    console.error("Gagal copy:", err);
    alert("Gagal menyalin teks.");
  }
};

export default function LeadRow({
  lead,
  copiedId,
  setCopiedId,
  onSelect,
  selectedLeads,
  products = [],
}) {
  const [showModal, setShowModal] = useState(false);

  const [realtimeLead, setRealtimeLead] = useState(lead);

  // =========================================================
  // FORM STATE
  // =========================================================

  const [nameValue, setNameValue] = useState(lead.name || "");

  const [whatsappValue, setWhatsappValue] = useState(lead.whatsapp || "");

  const [priceValue, setPriceValue] = useState(lead.price || 0);

  const [costProductValue, setCostProductValue] = useState(
    lead.costProduct || 0,
  );

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

  // =========================================================
  // PRODUCT + BUNDLE
  // =========================================================

  const [selectedProductId, setSelectedProductId] = useState(
    lead.productId || "",
  );

  const [selectedBundleId, setSelectedBundleId] = useState(lead.bundleId || "");

  // =========================================================
  // ADDRESS
  // =========================================================

  // =========================================================
  // CURRENT PRODUCT
  // =========================================================

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const bundles = selectedProduct?.bundles || [];

  const selectedBundle = bundles.find(
    (bundle) => bundle.id === selectedBundleId,
  );

  // =========================================================
  // REALTIME LEAD
  // =========================================================

  useEffect(() => {
    const leadRef = doc(db, "leads", lead.id);

    const unsubscribe = onSnapshot(
      leadRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        setRealtimeLead({
          id: snapshot.id,
          ...snapshot.data(),
        });
      },
      (error) => {
        console.error("Realtime lead listener error:", error);
      },
    );

    return () => unsubscribe();
  }, [lead.id]);

  // =========================================================
  // SYNC FORM WHEN LEAD CHANGES
  // =========================================================

  useEffect(() => {
    setNameValue(realtimeLead.name || "");
    setWhatsappValue(realtimeLead.whatsapp || "");
    setCleanAddressValue(realtimeLead.addressClean || "");
    setOngkirValue(realtimeLead.ongkir || 0);
    setReturnValue(realtimeLead.rts || 0);

    setConfirmationValue(realtimeLead.confirmation || "belum");
  }, [
    realtimeLead.name,
    realtimeLead.whatsapp,
    realtimeLead.addressClean,
    realtimeLead.ongkir,
    realtimeLead.rts,
    realtimeLead.confirmation,
  ]);

  // =========================================================
  // PRODUCT / BUNDLE SELECTION
  // =========================================================

  useEffect(() => {
    if (!selectedProduct) return;

    // =========================================
    // MAIN PRODUCT — TANPA BUNDLE
    // =========================================
    if (!selectedBundleId) {
      setProductTitleValue(selectedProduct.title || "");

      setPriceValue(Number(selectedProduct.pricing?.price || 0));

      setCostProductValue(Number(selectedProduct.pricing?.cost || 0));

      return;
    }

    // =========================================
    // BUNDLE
    // =========================================
    if (selectedBundle) {
      setProductTitleValue(selectedBundle.title || selectedProduct.title || "");

      setPriceValue(Number(selectedBundle.pricing?.price || 0));

      setCostProductValue(Number(selectedBundle.pricing?.cost || 0));
    }
  }, [selectedProduct, selectedBundle, selectedBundleId]);

  // =========================================================
  // MODAL SCROLL LOCK
  // =========================================================

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // =========================================================
  // CHECKBOX
  // =========================================================

  const isChecked = selectedLeads?.some((item) => item.id === lead.id);

  const aiStatus = realtimeLead.aiStatus || "NOT_QUEUED";

  const handleCheckboxChange = (e) => {
    onSelect?.(lead, e.target.checked);
  };

  // =========================================================
  // SAVE LEAD
  // =========================================================

  const handleSave = async () => {
    if (!priceValue || !costProductValue) {
      alert("Harga dan biaya produk tidak boleh kosong.");
      return;
    }

    try {
      await updateDoc(doc(db, "leads", lead.id), {
        productId: selectedProductId,

        bundleId: selectedBundleId || null,

        bundleTitle: selectedBundleId ? selectedBundle?.title || null : null,

        bundleQty: selectedBundleId ? selectedBundle?.quantity || 1 : 1,

        bundleBadge: selectedBundleId ? selectedBundle?.badge || "" : "",

        name: nameValue,

        whatsapp: whatsappValue,

        price: Number(priceValue),

        costProduct: Number(costProductValue),

        addressClean: cleanAddressValue,

        productTitle: productTitleValue,

        ongkir: Number(ongkirValue) || 0,

        total: Number(priceValue || 0) + Number(ongkirValue || 0),

        rts: Number(returnValue) || 0,

        confirmation: confirmationValue,

        queuedForMessage: false,

        updatedAt: new Date(),
      });

      setShowModal(false);
    } catch (err) {
      console.error("Gagal update lead:", err);

      alert("Gagal menyimpan data.");
    }
  };

  // =========================================================
  // STATUS
  // =========================================================

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (newStatus === realtimeLead.status) {
        return;
      }

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          status: newStatus,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Gagal update status:", err);

        alert("Gagal update status.");
      }
    },
    [lead.id, realtimeLead.status],
  );

  // =========================================================
  // BOT STATE
  // =========================================================

  const handleStateChange = useCallback(
    async (newState) => {
      if (newState === realtimeLead.state) {
        return;
      }

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          state: newState,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Gagal update state:", err);

        alert("Gagal update state.");
      }
    },
    [lead.id, realtimeLead.state],
  );

  // =========================================================
  // CONFIRMATION
  // =========================================================

  const handleConfirmationChange = useCallback(
    async (newConfirmation) => {
      if (newConfirmation === confirmationValue) {
        return;
      }

      setConfirmationValue(newConfirmation);

      setRealtimeLead((prev) => ({
        ...prev,
        confirmation: newConfirmation,
      }));

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          confirmation: newConfirmation,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Gagal update konfirmasi:", err);

        alert("Gagal update konfirmasi.");
      }
    },
    [lead.id, confirmationValue],
  );

  // =========================================================
  // RESI
  // =========================================================

  const handleResiCheckChange = useCallback(
    async (newResiCheck) => {
      if (newResiCheck === realtimeLead.resiCheck) {
        return;
      }

      setRealtimeLead((prev) => ({
        ...prev,
        resiCheck: newResiCheck,
      }));

      try {
        await updateDoc(doc(db, "leads", lead.id), {
          resiCheck: newResiCheck,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Gagal update resiCheck:", err);
      }
    },
    [lead.id, realtimeLead.resiCheck],
  );

  // =========================================================
  // COPY TOTAL
  // =========================================================

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

Nama: ${nameValue}
Alamat Lengkap: ${cleanAddressValue}

Pesanan akan segera diproses sesuai data yang telah dikirim saat checkout.

Terima kasih sudah pesan di toko kami 🙏
`;

    copyToClipboard(pesan, () => {
      setCopiedId(lead.id);

      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // =========================================================
  // COPY ADDRESS PROMPT
  // =========================================================

  const handleCopyAddress = () => {
    const prompt = `
Rapikan alamat mentah ini menjadi format administrasi Indonesia dengan struktur:

[PROVINSI], [KABUPATEN/KOTA], [KECAMATAN], [DESA/KELURAHAN], [KODE POS]

Sertakan juga "Alamat Lengkap" yang sudah rapi.

Contoh Output:

- Provinsi: ...
- Kabupaten/Kota: ...
- Kecamatan: ...
- Desa/Kelurahan: ...
- Kode Pos: ...
- Alamat Lengkap: ...

Alamat mentah: ${cleanAddressValue}
`;

    copyToClipboard(prompt, () => {
      setCopiedId(lead.id);

      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // =========================================================
  // OPTIONS
  // =========================================================

  const statusOptions = [
    {
      value: "pending",
      label: "🕓 Pending",
    },
    {
      value: "complete",
      label: "✅ Complete",
    },
    {
      value: "cancel",
      label: "❌ Cancel",
    },
    {
      value: "rts",
      label: "🚚 RTS",
    },
  ];

  const resiOptions = [
    {
      value: "not",
      label: "🕓 Belum Dicek",
    },
    {
      value: "done",
      label: "📦 Resi Dicek",
    },
  ];

  const stateOptions = [
    {
      value: "WAITING_CONFIRMATION",
      label: "🟡 Waiting Confirmation",
    },
    {
      value: "WAITING_UPSELL",
      label: "🟠 Waiting Upsell",
    },
    {
      value: "DONE",
      label: "✅ Done",
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          LEAD ROW
      ===================================================== */}

      <div
        className="
          grid grid-cols-10
          items-center
          gap-1
          cursor-pointer
          hover:bg-gray-50
          dark:hover:bg-gray-700
          px-2 py-1.5
          rounded-md
          transition
          bg-gray-50
          dark:bg-black
          text-xs
        "
        onClick={() => setShowModal(true)}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="
            scale-100
            accent-gray-800
            dark:accent-gray-200
          "
        />

        <span>
          {realtimeLead.createdAt?.seconds
            ? new Date(
                realtimeLead.createdAt.seconds * 1000,
              ).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
              })
            : "-"}
        </span>

        <span className="truncate min-w-0">{realtimeLead.name}</span>

        <a
          href={`https://wa.me/${realtimeLead.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-blue-600
            dark:text-blue-400
            hover:underline
            text-center
						truncate min-w-0
          "
          onClick={(e) => e.stopPropagation()}
        >
          {realtimeLead.whatsapp}
        </a>

        <span className="truncate min-w-0">{realtimeLead.paymentMethod}</span>

        <span className="truncate min-w-0">{realtimeLead.productTitle}</span>

        <span
          className={`uppercase font-semibold text-xs text-center ${
            realtimeLead.status === "complete"
              ? "text-green-600 dark:text-green-400"
              : realtimeLead.status === "cancel"
                ? "text-red-600 dark:text-red-400"
                : realtimeLead.status === "pending"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {realtimeLead.status}
        </span>

        <span className="text-sm text-center">
          {realtimeLead.confirmation === "sudah" ? "🟢" : "🔴"}
        </span>

        <span className="text-sm text-center">
          {realtimeLead.resiCheck === "done" ? "✅" : "❌"}
        </span>

        <span className="text-sm text-center">
          {realtimeLead.aiStatus === "SENT"
            ? "🟢"
            : realtimeLead.aiStatus === "PROCESSING"
              ? "🔵"
              : realtimeLead.aiStatus === "QUEUED"
                ? "🟡"
                : realtimeLead.aiStatus === "FAILED"
                  ? "🔴"
                  : "⚪"}
        </span>
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="
            fixed inset-0
            z-50
            flex items-center justify-center
            bg-black/50
            backdrop-blur-sm
            p-4
          "
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="
              relative
              bg-gray-50
              dark:bg-gray-900

              w-full
              max-w-5xl

              max-h-[92vh]

              rounded-2xl
              shadow-2xl

              overflow-hidden

              text-gray-800
              dark:text-gray-200

              flex
              flex-col
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                flex
                items-center
                justify-between
                px-6
                py-4
                border-b
                border-gray-200
                dark:border-gray-800
                shrink-0
              "
            >
              <div>
                <h2 className="text-xl font-bold">📄 Detail Lead</h2>

                <p className="text-xs text-gray-500 mt-1">
                  {realtimeLead.name || "Unnamed lead"}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="
                  w-9 h-9
                  flex
                  items-center
                  justify-center
                  rounded-lg
                  hover:bg-gray-200
                  dark:hover:bg-gray-800
                  transition
                "
              >
                ✕
              </button>
            </div>

            {/* =================================================
                BODY
            ================================================= */}

            <div
              className="
                overflow-y-auto
                p-6
                space-y-6
              "
            >
              {/* ===============================================
                  CUSTOMER
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">👤 Customer</h3>

                  <p className="text-[11px] text-gray-500">
                    Informasi customer
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium">Nama</label>

                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="
                        w-full
                        mt-1
                        border
                        border-gray-300
                        dark:border-gray-700
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                      "
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">
                      Nomor WhatsApp
                    </label>

                    <input
                      type="text"
                      value={whatsappValue}
                      onChange={(e) => setWhatsappValue(e.target.value)}
                      className="
                        w-full
                        mt-1
                        border
                        border-gray-300
                        dark:border-gray-700
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                      "
                    />
                  </div>
                </div>
              </section>

              {/* ===============================================
                  PRODUCT
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">🛒 Product</h3>

                  <p className="text-[11px] text-gray-500">
                    Pilih produk utama dan bundle
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* PRODUCT LIST */}

                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                      Main Product
                    </label>

                    <div className="space-y-2">
                      {!selectedProduct ? (
                        <div
                          className="
              border
              border-dashed
              border-gray-300
              dark:border-gray-700
              rounded-xl
              p-5
              text-center
              text-xs
              text-gray-500
            "
                        >
                          Product dari lead tidak ditemukan.
                        </div>
                      ) : (
                        <div
                          className="
              w-full
              text-left
              border
              border-black
              dark:border-white
              rounded-xl
              px-4
              py-3
              bg-white
              dark:bg-gray-800
            "
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {selectedProduct.title}
                              </p>

                              <p className="text-[11px] text-gray-500 mt-1">
                                Main Product — dari order customer
                              </p>
                            </div>

                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatHargaSingkat(
                                selectedProduct.pricing?.price,
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BUNDLE LIST */}

                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                      Bundle
                    </label>

                    {!selectedProduct ? (
                      <div
                        className="
                        border
                        border-dashed
                        border-gray-300
                        dark:border-gray-700
                        rounded-xl
                        p-5
                        text-center
                        text-xs
                        text-gray-500
                      "
                      >
                        Pilih produk terlebih dahulu
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* MAIN PRODUCT */}

                        <button
                          type="button"
                          onClick={() => setSelectedBundleId("")}
                          className={`
                            w-full
                            text-left
                            border
                            rounded-xl
                            px-4
                            py-3
                            transition

                            ${
                              !selectedBundleId
                                ? "border-black dark:border-white bg-white dark:bg-gray-800"
                                : "border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {selectedProduct.title}
                              </p>

                              <p className="text-[11px] text-gray-500 mt-1">
                                Main Product — tanpa bundle
                              </p>
                            </div>

                            <span className="text-xs text-gray-500">
                              {formatHargaSingkat(
                                selectedProduct.pricing?.price,
                              )}
                            </span>
                          </div>
                        </button>

                        {/* BUNDLES */}

                        {bundles.length === 0 ? (
                          <div
                            className="
                            border
                            border-dashed
                            border-gray-300
                            dark:border-gray-700
                            rounded-xl
                            p-5
                            text-center
                            text-xs
                            text-gray-500
                          "
                          >
                            Produk ini belum memiliki bundle.
                          </div>
                        ) : (
                          bundles.map((bundle) => {
                            const active = selectedBundleId === bundle.id;

                            return (
                              <button
                                type="button"
                                key={bundle.id}
                                onClick={() => setSelectedBundleId(bundle.id)}
                                className={`
                                    w-full
                                    text-left
                                    border
                                    rounded-xl
                                    px-4
                                    py-3
                                    transition

                                    ${
                                      active
                                        ? "border-black dark:border-white bg-white dark:bg-gray-800"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                                    }
                                  `}
                              >
                                <div className="flex justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {bundle.title}
                                    </p>

                                    <p className="text-[11px] text-gray-500 mt-1">
                                      Bundle
                                    </p>
                                  </div>

                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatHargaSingkat(bundle.pricing?.price)}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CURRENT SELECTION */}

                <div
                  className="
                  mt-4
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  p-4
                "
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[11px] text-gray-500">
                        Selected Product
                      </p>

                      <p className="font-semibold text-sm mt-1">
                        {productTitleValue || "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-gray-500">Harga</p>

                      <p className="font-bold">
                        {formatHargaSingkat(priceValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===============================================
                  FINANCIAL
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">💰 Financial</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium">Harga</label>

                    <input
                      type="number"
                      value={priceValue}
                      onChange={(e) => setPriceValue(Number(e.target.value))}
                      className="
                        w-full
                        mt-1
                        border
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                        border-gray-300
                        dark:border-gray-700
                      "
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Cost Product</label>

                    <input
                      type="number"
                      value={costProductValue}
                      onChange={(e) =>
                        setCostProductValue(Number(e.target.value))
                      }
                      className="
                        w-full
                        mt-1
                        border
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                        border-gray-300
                        dark:border-gray-700
                      "
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Biaya Ongkir</label>

                    <input
                      type="number"
                      value={ongkirValue}
                      onChange={(e) => setOngkirValue(Number(e.target.value))}
                      className="
                        w-full
                        mt-1
                        border
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                        border-gray-300
                        dark:border-gray-700
                      "
                    />
                  </div>
                </div>

                {realtimeLead.status === "rts" && (
                  <div className="mt-4 max-w-xs">
                    <label className="text-xs font-medium">Biaya Return</label>

                    <input
                      type="number"
                      value={returnValue}
                      onChange={(e) => setReturnValue(e.target.value)}
                      className="
                        w-full
                        mt-1
                        border
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white
                        dark:bg-gray-800
                        border-gray-300
                        dark:border-gray-700
                      "
                    />
                  </div>
                )}
              </section>

              {/* ===============================================
                  ADDRESS
              =============================================== */}

              <section>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">📍 Address</h3>

                    <p className="text-[11px] text-gray-500">Alamat customer</p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={cleanAddressValue}
                  onChange={(e) => setCleanAddressValue(e.target.value)}
                  className="
                    w-full
                    border
                    border-gray-300
                    dark:border-gray-700
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    bg-white
                    dark:bg-gray-800
                    resize-none
                  "
                />
              </section>

              {/* ===============================================
                  ORDER STATUS
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">📦 Order Management</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Order Status
                    </label>

                    <select
                      value={realtimeLead.status || "pending"}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="
                        w-full
                        mt-1
                        px-3
                        py-2.5
                        text-sm
                        rounded-lg
                        border
                        border-gray-300
                        dark:border-gray-700
                        bg-white
                        dark:bg-gray-800
                      "
                    >
                      {statusOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Bot State
                    </label>

                    <select
                      value={realtimeLead.state || ""}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="
                        w-full
                        mt-1
                        px-3
                        py-2.5
                        text-sm
                        rounded-lg
                        border
                        border-gray-300
                        dark:border-gray-700
                        bg-white
                        dark:bg-gray-800
                      "
                    >
                      {stateOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* ===============================================
                  COMMUNICATION
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">💬 Communication</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* CONFIRMATION */}

                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Customer Confirm
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmationChange("sudah")}
                        className={`
                          px-4
                          py-2
                          text-xs
                          rounded-lg
                          border

                          ${
                            confirmationValue === "sudah"
                              ? "bg-green-600 text-white border-green-600"
                              : "border-gray-300 dark:border-gray-700"
                          }
                        `}
                      >
                        ✅ Sudah
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmationChange("belum")}
                        className={`
                          px-4
                          py-2
                          text-xs
                          rounded-lg
                          border

                          ${
                            confirmationValue === "belum"
                              ? "bg-red-600 text-white border-red-600"
                              : "border-gray-300 dark:border-gray-700"
                          }
                        `}
                      >
                        ❌ Belum
                      </button>
                    </div>
                  </div>

                  {/* RESI */}

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Resi Check</p>

                    <div className="flex gap-2">
                      {resiOptions.map(({ value, label }) => (
                        <button
                          type="button"
                          key={value}
                          onClick={() => handleResiCheckChange(value)}
                          className={`
                              px-4
                              py-2
                              text-xs
                              rounded-lg
                              border

                              ${
                                (realtimeLead.resiCheck || "not") === value
                                  ? "bg-black dark:bg-gray-700 text-white"
                                  : "border-gray-300 dark:border-gray-700"
                              }
                            `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ===============================================
                  AI
              =============================================== */}

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm">🤖 AI Automation</h3>
                </div>

                <div
                  className={`
                    inline-flex
                    px-4
                    py-2
                    rounded-lg
                    text-xs
                    font-semibold

                    ${
                      aiStatus === "SENT"
                        ? "bg-green-600 text-white"
                        : aiStatus === "PROCESSING"
                          ? "bg-blue-600 text-white"
                          : aiStatus === "QUEUED"
                            ? "bg-yellow-500 text-white"
                            : aiStatus === "FAILED"
                              ? "bg-red-600 text-white"
                              : "bg-gray-300 text-gray-800"
                    }
                  `}
                >
                  {aiStatus === "SENT"
                    ? "✅ Notification Sent"
                    : aiStatus === "PROCESSING"
                      ? "🔵 Processing"
                      : aiStatus === "QUEUED"
                        ? "🟡 Queued"
                        : aiStatus === "FAILED"
                          ? "❌ Failed"
                          : "⚪ Not Queued"}
                </div>

                {aiStatus === "PROCESSING" && realtimeLead.aiProcessingAt && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Processing sejak{" "}
                    {realtimeLead.aiProcessingAt
                      ?.toDate?.()
                      ?.toLocaleTimeString("id-ID")}
                  </p>
                )}

                {aiStatus === "SENT" && realtimeLead.aiLastSentAt && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Sent pada{" "}
                    {realtimeLead.aiLastSentAt
                      ?.toDate?.()
                      ?.toLocaleTimeString("id-ID")}
                  </p>
                )}
              </section>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div
              className="
                shrink-0
                border-t
                border-gray-200
                dark:border-gray-800
                px-6
                py-4
                flex
                flex-wrap
                justify-between
                items-center
                gap-3
                bg-gray-50
                dark:bg-gray-900
              "
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="
                    px-4
                    py-2
                    rounded-lg
                    bg-black
                    dark:bg-gray-700
                    text-white
                    text-xs
                    font-semibold
                  "
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Total"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="
                    px-4
                    py-2
                    rounded-lg
                    bg-black
                    dark:bg-gray-700
                    text-white
                    text-xs
                    font-semibold
                  "
                >
                  {copiedId === lead.id ? "✅ Disalin!" : "📋 Salin Alamat"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Hapus data atas nama ${realtimeLead.name}?`,
                      )
                    ) {
                      await deleteDoc(doc(db, "leads", lead.id));

                      setShowModal(false);
                    }
                  }}
                  className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-red-300
                    text-red-600
                    dark:text-red-400
                    text-xs
                    font-semibold
                  "
                >
                  🗑️ Hapus
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="
                  px-6
                  py-2.5
                  rounded-lg
                  bg-black
                  dark:bg-white
                  dark:text-black
                  text-white
                  text-sm
                  font-semibold
                  hover:opacity-90
                  transition
                "
              >
                💾 Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
