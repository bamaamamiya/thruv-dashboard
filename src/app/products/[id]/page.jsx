"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useParams } from "next/navigation";

import { db } from "@/lib/firebaseClient";

import ProductBasicInfo from "@/app/products/components/ProductBasicInfo";
import ProductBundles from "@/app/products/components/ProductBundles";
import ProductActions from "@/app/products/components/ProductActions";
import FeatureToggle from "@/app/products/components/FeatureToggle";

const DEFAULT_SETTINGS = {
  checkout: {
    cod: true,
    bankTransfer: true,
    ongkir: true,
    bundle: true,
  },

  automation: {
    aiAgent: false,
    reminder: false,
    faq: false,
    followUp: false,
    upsell: false,
  },

  comparePrice: true,
  saveLead: true,
  abandonedLead: true,

  countdown: false,
  countdownMinute: 15,

  showStock: true,
  maxOrder: 3,
};

const CHECKOUT_SETTINGS = [
  {
    key: "bundle",
    title: "Bundle",
    description: "Aktifkan pilihan paket",
  },
  {
    key: "cod",
    title: "COD",
    description: "Bayar di tempat",
  },
  {
    key: "bankTransfer",
    title: "Bank Transfer",
    description: "Aktifkan pembayaran transfer bank",
  },
  {
    key: "ongkir",
    title: "Shipping",
    description: "Hitung ongkir otomatis",
  },
];

const AUTOMATION_SETTINGS = [
  {
    key: "aiAgent",
    title: "AI Agent",
    description: "Aktifkan AI Customer Service untuk produk ini",
  },
  {
    key: "reminder",
    title: "Reminder",
    description: "Kirim reminder otomatis",
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Aktifkan automation FAQ",
  },
  {
    key: "followUp",
    title: "Follow Up",
    description: "Follow up customer otomatis",
  },
  {
    key: "upsell",
    title: "Upsell",
    description: "Tawarkan produk tambahan",
  },
];

const GENERAL_SETTINGS = [
  {
    key: "comparePrice",
    title: "Compare Price",
    description: "Menampilkan harga coret",
  },
  {
    key: "saveLead",
    title: "Save Lead",
    description: "Simpan lead",
  },
  {
    key: "abandonedLead",
    title: "Abandoned Lead",
    description: "Simpan lead yang belum checkout",
  },
  {
    key: "countdown",
    title: "Countdown",
    description: "Tampilkan countdown promo",
  },
  {
    key: "showStock",
    title: "Show Stock",
    description: "Tampilkan informasi stok",
  },
];

export default function EditProductPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);

  const [imageUrlInput, setImageUrlInput] = useState("");

  const [images, setImages] = useState([]);

  const [bundles, setBundles] = useState([]);

  const [form, setForm] = useState({
    id: "",
    title: "",
    price: "",
    cost: "",

    settings: DEFAULT_SETTINGS,
  });

  const productRef = id ? doc(db, "products", id) : null;

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    try {
      const ref = doc(db, "products", id);

      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        console.log("Product tidak ditemukan:", id);
        return;
      }

      const data = snapshot.data();

      const settings = data.settings || {};

      setForm({
        id: data.id || id,

        title: data.title || "",

        price: data.pricing?.price ?? "",

        cost: data.pricing?.cost ?? "",

        settings: {
          checkout: {
            cod: settings.checkout?.cod ?? DEFAULT_SETTINGS.checkout.cod,

            bankTransfer:
              settings.checkout?.bankTransfer ??
              DEFAULT_SETTINGS.checkout.bankTransfer,

            ongkir:
              settings.checkout?.ongkir ?? DEFAULT_SETTINGS.checkout.ongkir,

            bundle:
              settings.checkout?.bundle ?? DEFAULT_SETTINGS.checkout.bundle,
          },

          automation: {
            aiAgent:
              settings.automation?.aiAgent ??
              DEFAULT_SETTINGS.automation.aiAgent,

            reminder:
              settings.automation?.reminder ??
              DEFAULT_SETTINGS.automation.reminder,

            faq: settings.automation?.faq ?? DEFAULT_SETTINGS.automation.faq,

            followUp:
              settings.automation?.followUp ??
              DEFAULT_SETTINGS.automation.followUp,

            upsell:
              settings.automation?.upsell ?? DEFAULT_SETTINGS.automation.upsell,
          },

          comparePrice: settings.comparePrice ?? DEFAULT_SETTINGS.comparePrice,

          saveLead: settings.saveLead ?? DEFAULT_SETTINGS.saveLead,

          abandonedLead:
            settings.abandonedLead ?? DEFAULT_SETTINGS.abandonedLead,

          countdown: settings.countdown ?? DEFAULT_SETTINGS.countdown,

          countdownMinute:
            settings.countdownMinute ?? DEFAULT_SETTINGS.countdownMinute,

          showStock: settings.showStock ?? DEFAULT_SETTINGS.showStock,

          maxOrder: settings.maxOrder ?? DEFAULT_SETTINGS.maxOrder,
        },
      });

      setImages(data.images || []);

      setBundles(
        (data.bundles || []).map((bundle) => ({
          id: bundle.id || crypto.randomUUID(),

          title: bundle.title || "",

          subtitle: bundle.subtitle || "",

          quantity: bundle.quantity || 1,

          badge: bundle.badge || "",

          comparePrice: bundle.comparePrice || 0,

          pricing: {
            price: bundle.pricing?.price || 0,
            cost: bundle.pricing?.cost || 0,
          },
        })),
      );
    } catch (err) {
      console.error("❌ Fetch product error:", err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleToggle(group, key, value) {
    setForm((prev) => ({
      ...prev,

      settings: {
        ...prev.settings,

        [group]:
          group === "checkout" || group === "automation"
            ? {
                ...prev.settings[group],
                [key]: value,
              }
            : prev.settings[group],
      },
    }));
  }

  function handleGeneralToggle(key, value) {
    setForm((prev) => ({
      ...prev,

      settings: {
        ...prev.settings,

        [key]: value,
      },
    }));
  }

  function getEconomics() {
    const price = Number(form.price) || 0;
    const cost = Number(form.cost) || 0;

    // =========================
    // BASIC ECONOMICS
    // =========================

    // Profit sebelum advertising
    const contributionProfit = price - cost;

    // Contribution margin
    const contributionMargin =
      price > 0 ? (contributionProfit / price) * 100 : 0;

    // =========================
    // TARGET
    // =========================

    // Target net margin setelah CAC
    const targetNetProfitMargin = 22.5;

    // Nominal net profit yang ingin dipertahankan
    const targetNetProfit = price * (targetNetProfitMargin / 100);

    // =========================
    // CAC THRESHOLDS
    // =========================

    // CAC maksimum agar masih mendapatkan
    // target net margin 30%
    const scaleCAC = Math.max(0, contributionProfit - targetNetProfit);

    // CAC maksimum sebelum profit menjadi 0
    const breakEvenCAC = Math.max(0, contributionProfit);

    return {
      price,
      cost,

      contributionProfit,
      contributionMargin,

      targetNetProfitMargin,
      targetNetProfit,

      scaleCAC,
      breakEvenCAC,
    };
  }

  function handleAddImage() {
    const url = imageUrlInput.trim();

    if (!url) return;

    if (images.length >= 10) {
      alert("Maksimal 10 gambar");
      return;
    }

    setImages((prev) => [...prev, url]);

    setImageUrlInput("");
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddBundle() {
    setBundles((prev) => [
      ...prev,

      {
        id: crypto.randomUUID(),

        title: "",

        subtitle: "",

        quantity: 1,

        badge: "",

        comparePrice: 0,

        pricing: {
          price: 0,
          cost: 0,
        },
      },
    ]);
  }

  function handleBundleChange(index, field, value) {
    const updated = [...bundles];

    if (field === "price" || field === "cost") {
      updated[index].pricing[field] = Number(value);
    } else if (field === "quantity") {
      updated[index].quantity = Number(value);
    } else if (field === "comparePrice") {
      updated[index].comparePrice = Number(value);
    } else {
      updated[index][field] = value;
    }

    setBundles(updated);
  }

  function handleRemoveBundle(index) {
    setBundles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpdate() {
    if (!id) return;

    setLoading(true);

    try {
      const newId = form.id.trim();

      if (!newId) {
        alert("Product ID wajib");
        setLoading(false);
        return;
      }

      if (!form.title.trim()) {
        alert("Product title wajib");
        setLoading(false);
        return;
      }

      if (!form.price) {
        alert("Product price wajib");
        setLoading(false);
        return;
      }

      const payload = {
        id: newId,

        title: form.title,

        settings: {
          checkout: {
            cod: Boolean(form.settings.checkout.cod),

            bankTransfer: Boolean(form.settings.checkout.bankTransfer),

            ongkir: Boolean(form.settings.checkout.ongkir),

            bundle: Boolean(form.settings.checkout.bundle),
          },

          automation: {
            aiAgent: Boolean(form.settings.automation.aiAgent),

            reminder: Boolean(form.settings.automation.reminder),

            faq: Boolean(form.settings.automation.faq),

            followUp: Boolean(form.settings.automation.followUp),

            upsell: Boolean(form.settings.automation.upsell),
          },

          comparePrice: Boolean(form.settings.comparePrice),

          saveLead: Boolean(form.settings.saveLead),

          abandonedLead: Boolean(form.settings.abandonedLead),

          countdown: Boolean(form.settings.countdown),

          countdownMinute: Number(form.settings.countdownMinute || 15),

          showStock: Boolean(form.settings.showStock),

          maxOrder: Number(form.settings.maxOrder || 3),
        },

        pricing: {
          price: Number(form.price),
          cost: Number(form.cost) || 0,
        },

        bundles,

        images,

        updatedAt: Timestamp.now(),
      };

      if (newId !== id) {
        await setDoc(doc(db, "products", newId), payload);

        await deleteDoc(doc(db, "products", id));
      } else {
        await updateDoc(doc(db, "products", id), payload);
      }

      alert("Product updated 🚀");
    } catch (err) {
      console.error("❌ Update product error:", err);

      alert("Gagal update product");
    } finally {
      setLoading(false);
    }
  }

  if (!id) {
    return <div className="p-6">Loading...</div>;
  }

  const economics = getEconomics();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>

        <p className="text-sm text-gray-500">
          Atur product, bundle, checkout, dan automation.
        </p>
      </div>

      {/* BASIC INFO */}

      <div className="border rounded-2xl p-5">
        <ProductBasicInfo form={form} onChange={handleChange} />
      </div>

      {/* ECONOMICS */}

      <div className="border rounded-2xl p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-lg">💰 Product Economics</h2>

          <p className="text-sm text-gray-500">
            Menentukan batas CAC berdasarkan target net margin produk.
          </p>
        </div>

        {/* BASIC ECONOMICS */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* SELLING PRICE */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">Selling Price</p>

            <p className="text-lg font-semibold mt-1">
              Rp {economics.price.toLocaleString("id-ID")}
            </p>
          </div>

          {/* HPP */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">HPP</p>

            <p className="text-lg font-semibold mt-1">
              Rp {economics.cost.toLocaleString("id-ID")}
            </p>
          </div>

          {/* CONTRIBUTION */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">Contribution Profit</p>

            <p className="text-lg font-semibold text-green-600 mt-1">
              Rp {economics.contributionProfit.toLocaleString("id-ID")}
            </p>
          </div>

          {/* CONTRIBUTION MARGIN */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">Contribution Margin</p>

            <p className="text-lg font-semibold mt-1">
              {economics.contributionMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* TARGET NET PROFIT */}

        <div className="border rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Target Net Profit</p>

              <p className="text-xs text-gray-400 mt-1">
                Target {economics.targetNetProfitMargin}% dari selling price
                setelah CAC.
              </p>
            </div>

            <p className="text-2xl font-bold">
              Rp {economics.targetNetProfit.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* SCALE CAC */}

        <div className="border rounded-2xl p-6 bg-green-50">
          <p className="text-sm font-medium text-green-700">🟢 SCALE CAC</p>

          <p className="text-4xl font-bold text-green-700 mt-2">
            Rp {economics.scaleCAC.toLocaleString("id-ID")}
          </p>

          <p className="text-sm text-green-700 mt-2">
            CAC maksimal agar produk masih mencapai target net margin{" "}
            {economics.targetNetProfitMargin}%.
          </p>
        </div>

        {/* BREAK EVEN CAC */}

        <div className="border rounded-2xl p-6 bg-red-50">
          <p className="text-sm font-medium text-red-700">🔴 BREAK-EVEN CAC</p>

          <p className="text-3xl font-bold text-red-700 mt-2">
            Rp {economics.breakEvenCAC.toLocaleString("id-ID")}
          </p>

          <p className="text-sm text-red-700 mt-2">
            CAC pada titik ini membuat net profit menjadi Rp 0.
          </p>
        </div>

        {/* CAC RANGE */}

        <div className="border rounded-xl p-5">
          <div className="mb-4">
            <p className="font-semibold">CAC Performance Range</p>

            <p className="text-xs text-gray-500 mt-1">
              Bandingkan CAC aktual dari Ads Manager dengan batas economics
              produk.
            </p>
          </div>

          {/* RANGE BAR */}

          <div className="relative">
            <div className="flex h-4 rounded-full overflow-hidden">
              {/* SCALE */}

              <div
                className="bg-green-500"
                style={{
                  width:
                    economics.breakEvenCAC > 0
                      ? `${Math.min(
                          100,
                          (economics.scaleCAC / economics.breakEvenCAC) * 100,
                        )}%`
                      : "0%",
                }}
              />

              {/* WATCH */}

              <div
                className="bg-yellow-400"
                style={{
                  width:
                    economics.breakEvenCAC > 0
                      ? `${Math.max(
                          0,
                          100 -
                            (economics.scaleCAC / economics.breakEvenCAC) * 100,
                        )}%`
                      : "0%",
                }}
              />
            </div>

            {/* LABEL */}

            <div className="flex justify-between mt-3 text-xs">
              <span className="text-green-600 font-medium">🟢 SCALE</span>

              <span className="text-yellow-600 font-medium">🟡 WATCH</span>

              <span className="text-red-600 font-medium">🔴 STOP</span>
            </div>

            {/* VALUES */}

            <div className="flex justify-between mt-2 text-xs">
              <span>Rp 0</span>

              <span className="font-semibold text-green-600">
                Scale: Rp {economics.scaleCAC.toLocaleString("id-ID")}
              </span>

              <span className="font-semibold text-red-600">
                BE: Rp {economics.breakEvenCAC.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* DECISION RULES */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SCALE */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">CAC ≤ Scale CAC</p>

            <p className="text-sm font-semibold text-green-600 mt-1">
              🟢 SCALE
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Net margin ≥ {economics.targetNetProfitMargin}%.
            </p>
          </div>

          {/* WATCH */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">
              Scale CAC &lt; CAC &lt; BE CAC
            </p>

            <p className="text-sm font-semibold text-yellow-600 mt-1">
              🟡 WATCH
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Masih profitable, tetapi net margin sudah di bawah target.
            </p>
          </div>

          {/* STOP */}

          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500">CAC ≥ BE CAC</p>

            <p className="text-sm font-semibold text-red-600 mt-1">🔴 STOP</p>

            <p className="text-xs text-gray-500 mt-1">Net profit ≤ Rp 0.</p>
          </div>
        </div>
      </div>

      {/* IMAGES */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Product Images</h2>

          <p className="text-sm text-gray-500">Maksimal 10 gambar.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {images.map((img, index) => (
            <div
              key={`${img}-${index}`}
              className="relative w-24 h-24 border rounded-xl overflow-hidden"
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-white text-red-500 rounded-full px-2 py-1 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            className="border rounded-lg p-2 flex-1"
          />

          <button
            type="button"
            onClick={handleAddImage}
            className="bg-black text-white px-4 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* BUNDLES */}

      <div className="border rounded-2xl p-5">
        <ProductBundles
          bundles={bundles}
          comparePriceEnabled={form.settings.comparePrice}
          onAddBundle={handleAddBundle}
          onBundleChange={handleBundleChange}
          onRemoveBundle={handleRemoveBundle}
        />
      </div>

      {/* CHECKOUT SETTINGS */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">🛒 Checkout Settings</h2>

          <p className="text-sm text-gray-500">
            Atur fitur yang tersedia di funnel checkout.
          </p>
        </div>

        <div className="space-y-3">
          {CHECKOUT_SETTINGS.map((feature) => (
            <FeatureToggle
              key={feature.key}
              title={feature.title}
              description={feature.description}
              value={form.settings.checkout[feature.key]}
              onChange={(value) => handleToggle("checkout", feature.key, value)}
            />
          ))}
        </div>
      </div>

      {/* AUTOMATION SETTINGS */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">🤖 Automation Settings</h2>

          <p className="text-sm text-gray-500">
            Automation hanya berjalan jika fitur product tersebut aktif.
          </p>
        </div>

        <div className="space-y-3">
          {AUTOMATION_SETTINGS.map((feature) => (
            <FeatureToggle
              key={feature.key}
              title={feature.title}
              description={feature.description}
              value={form.settings.automation[feature.key]}
              onChange={(value) =>
                handleToggle("automation", feature.key, value)
              }
            />
          ))}
        </div>
      </div>

      {/* GENERAL SETTINGS */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">⚙️ General Settings</h2>

          <p className="text-sm text-gray-500">
            Pengaturan tambahan untuk product.
          </p>
        </div>

        <div className="space-y-3">
          {GENERAL_SETTINGS.map((feature) => (
            <FeatureToggle
              key={feature.key}
              title={feature.title}
              description={feature.description}
              value={form.settings[feature.key]}
              onChange={(value) => handleGeneralToggle(feature.key, value)}
            />
          ))}
        </div>

        {/* COUNTDOWN MINUTE */}

        {form.settings.countdown && (
          <div>
            <label className="text-sm font-medium">Countdown Duration</label>

            <input
              type="number"
              min="1"
              value={form.settings.countdownMinute}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    countdownMinute: Number(e.target.value),
                  },
                }))
              }
              className="border rounded-lg p-2 w-full mt-1"
            />
          </div>
        )}

        {/* MAX ORDER */}

        <div>
          <label className="text-sm font-medium">Max Order</label>

          <input
            type="number"
            min="1"
            value={form.settings.maxOrder}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  maxOrder: Number(e.target.value),
                },
              }))
            }
            className="border rounded-lg p-2 w-full mt-1"
          />
        </div>
      </div>

      {/* DEBUG AUTOMATION */}

      <div className="border rounded-2xl p-5 bg-gray-50">
        <h2 className="font-semibold mb-2">🔍 Automation Preview</h2>

        <pre className="text-xs overflow-auto">
          {JSON.stringify(form.settings, null, 2)}
        </pre>
      </div>

      {/* ACTION */}

      <ProductActions loading={loading} onSave={handleUpdate} />
    </div>
  );
}
