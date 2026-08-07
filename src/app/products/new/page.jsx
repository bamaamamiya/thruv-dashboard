"use client";

import { useState } from "react";

import { db } from "@/lib/firebaseClient";

import {
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { CATEGORY_OPTIONS } from "@/lib/categories";

import FeatureToggle from "@/app/products/components/FeatureToggle";

import ProductBundles from "@/app/products/components/ProductBundles";

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
    description:
      "Aktifkan AI Customer Service untuk product ini",
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
    description:
      "Simpan lead yang belum checkout",
  },
  {
    key: "countdown",
    title: "Countdown",
    description:
      "Tampilkan countdown promo",
  },
  {
    key: "showStock",
    title: "Show Stock",
    description:
      "Tampilkan informasi stok",
  },
];

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState([]);

  const [bundles, setBundles] = useState([]);

  const [imageUrlInput, setImageUrlInput] =
    useState("");

  const [inputMode, setInputMode] =
    useState("form");

  const [jsonInput, setJsonInput] =
    useState("");

  const [jsonError, setJsonError] =
    useState("");

  const [jsonProductData, setJsonProductData] =
    useState(null);

  const [form, setForm] = useState({
    id: "",
    slug: "",
    title: "",
    description: "",
    price: "",
    cost: "",
    category: "",
    stock: "",

    upsells: [],

    settings: DEFAULT_SETTINGS,
  });

  function generateSlug(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "title") {
      setForm((prev) => ({
        ...prev,
        title: value,
        slug: generateSlug(value),
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleToggle(
    group,
    key,
    value,
  ) {
    setForm((prev) => ({
      ...prev,

      settings: {
        ...prev.settings,

        [group]: {
          ...prev.settings[group],
          [key]: value,
        },
      },
    }));
  }

  function handleGeneralToggle(
    key,
    value,
  ) {
    setForm((prev) => ({
      ...prev,

      settings: {
        ...prev.settings,

        [key]: value,
      },
    }));
  }

  function handleAddImage() {
    const url = imageUrlInput.trim();

    if (!url) return;

    if (images.length >= 10) {
      alert("Maksimal 10 gambar");
      return;
    }

    setImages((prev) => [
      ...prev,
      url,
    ]);

    setImageUrlInput("");
  }

  function handleRemoveImage(index) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index),
    );
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

  function handleBundleChange(
    index,
    field,
    value,
  ) {
    const updated = [...bundles];

    if (
      field === "price" ||
      field === "cost"
    ) {
      updated[index].pricing[field] =
        Number(value);
    } else if (
      field === "quantity"
    ) {
      updated[index].quantity =
        Number(value);
    } else if (
      field === "comparePrice"
    ) {
      updated[index].comparePrice =
        Number(value);
    } else {
      updated[index][field] =
        value;
    }

    setBundles(updated);
  }

  function handleRemoveBundle(index) {
    setBundles((prev) =>
      prev.filter(
        (_, i) => i !== index,
      ),
    );
  }

  function mapJsonToForm(productData) {
    const productId =
      productData.product_id ||
      productData.id ||
      "";

    const identity =
      productData.identity || {};

    const pricing =
      productData.pricing || {};

    const title =
      identity.name ||
      productData.title ||
      "";

    return {
      id: productId,

      slug: generateSlug(
        title || productId,
      ),

      title,

      description:
        identity.description_long ||
        identity.description_short ||
        productData.description ||
        "",

      price:
        pricing.base_price?.toString() ||
        "",

      cost:
        pricing.cost?.toString() ||
        "",

      category:
        identity.category || "",

      stock:
        productData.stock?.toString() ||
        "",

      upsells:
        (pricing.upsell || []).map(
          (item, index) => ({
            id: `${
              productId || "upsell"
            }-${index + 1}`,

            title:
              item.variant || "",

            code: generateSlug(
              item.variant ||
                `variant-${index + 1}`,
            ),

            price:
              Number(
                pricing.base_price ||
                  0,
              ) +
              Number(
                item.extra || 0,
              ),

            cost: 0,
          }),
        ),

      settings: DEFAULT_SETTINGS,
    };
  }

  function parseJsonProduct() {
    try {
      const parsed =
        JSON.parse(jsonInput);

      const nextForm =
        mapJsonToForm(parsed);

      if (
        !nextForm.id ||
        !nextForm.title ||
        !nextForm.price
      ) {
        setJsonError(
          "JSON harus punya product_id, identity.name, dan pricing.base_price.",
        );

        return null;
      }

      setForm(nextForm);

      setJsonProductData(parsed);

      setJsonError("");

      return {
        parsed,
        nextForm,
      };
    } catch {
      setJsonError(
        "Format JSON belum valid. Cek koma, kutip, atau kurungnya.",
      );

      return null;
    }
  }

  async function handleSubmit() {
    let importedJson =
      jsonProductData;

    let submitForm = form;

    if (inputMode === "json") {
      const result =
        parseJsonProduct();

      if (!result) return;

      importedJson =
        result.parsed;

      submitForm =
        result.nextForm;
    }

    if (
      !submitForm.id ||
      !submitForm.title ||
      !submitForm.price
    ) {
      alert(
        "ID, Title & Price wajib",
      );

      return;
    }

    if (images.length === 0) {
      alert(
        "Minimal 1 gambar",
      );

      return;
    }

    setLoading(true);

    try {
      const productRef =
        doc(
          db,
          "products",
          submitForm.id,
        );

      const identity =
        importedJson?.identity ||
        {};

      const settings = {
        checkout: {
          cod: Boolean(
            submitForm.settings
              .checkout.cod,
          ),

          bankTransfer:
            Boolean(
              submitForm.settings
                .checkout
                .bankTransfer,
            ),

          ongkir: Boolean(
            submitForm.settings
              .checkout
              .ongkir,
          ),

          bundle: Boolean(
            submitForm.settings
              .checkout
              .bundle,
          ),
        },

        automation: {
          aiAgent: Boolean(
            submitForm.settings
              .automation
              .aiAgent,
          ),

          reminder: Boolean(
            submitForm.settings
              .automation
              .reminder,
          ),

          faq: Boolean(
            submitForm.settings
              .automation
              .faq,
          ),

          followUp: Boolean(
            submitForm.settings
              .automation
              .followUp,
          ),

          upsell: Boolean(
            submitForm.settings
              .automation
              .upsell,
          ),
        },

        comparePrice:
          Boolean(
            submitForm.settings
              .comparePrice,
          ),

        saveLead:
          Boolean(
            submitForm.settings
              .saveLead,
          ),

        abandonedLead:
          Boolean(
            submitForm.settings
              .abandonedLead,
          ),

        countdown:
          Boolean(
            submitForm.settings
              .countdown,
          ),

        countdownMinute:
          Number(
            submitForm.settings
              .countdownMinute ||
              15,
          ),

        showStock:
          Boolean(
            submitForm.settings
              .showStock,
          ),

        maxOrder:
          Number(
            submitForm.settings
              .maxOrder || 3,
          ),
      };

      await setDoc(
        productRef,
        {
          id: submitForm.id,

          slug:
            submitForm.slug || "",

          title:
            submitForm.title,

          settings,

          description:
            submitForm.description,

          category:
            submitForm.category,

          brand:
            identity.brand || "",

          status:
            identity.status ||
            "active",

          images,

          pricing: {
            price:
              Number(
                submitForm.price,
              ),

            cost:
              Number(
                submitForm.cost,
              ) || 0,

            ...(importedJson?.pricing ||
              {}),
          },

          stock:
            Number(
              submitForm.stock,
            ) || 0,

          bundles,

          upsells:
            submitForm.upsells ||
            [],

          scripts: {
            opening: "",
            closing: "",
            upsell: "",
          },

          productData:
            importedJson || null,

          identity:
            importedJson?.identity ||
            null,

          specification:
            importedJson?.specification ||
            null,

          usage:
            importedJson?.usage ||
            null,

          constraints:
            importedJson?.constraints ||
            [],

          shipping:
            importedJson?.shipping ||
            null,

          objections:
            importedJson?.objections ||
            [],

          scenarios:
            importedJson?.scenarios ||
            [],

          faq:
            importedJson?.faq ||
            [],

          isActive:
            identity.status
              ? identity.status ===
                "active"
              : true,

          createdAt:
            Timestamp.now(),

          updatedAt:
            Timestamp.now(),
        },
      );

      console.log(
        "✅ PRODUCT CREATED:",
        {
          productId:
            submitForm.id,

          aiAgent:
            settings.automation
              .aiAgent,

          settings,
        },
      );

      alert(
        "Product created 🚀",
      );
    } catch (err) {
      console.error(
        "❌ Create product error:",
        err,
      );

      alert(
        "Gagal membuat product",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Create Product
        </h1>

        <p className="text-sm text-gray-500">
          Buat product dengan schema
          yang kompatibel dengan
          OrderMachine dan automation.
        </p>
      </div>

      {/* INPUT MODE */}

      <div className="border rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() =>
              setInputMode("form")
            }
            className={`rounded-lg p-2 text-sm ${
              inputMode === "form"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            Form
          </button>

          <button
            type="button"
            onClick={() =>
              setInputMode("json")
            }
            className={`rounded-lg p-2 text-sm ${
              inputMode === "json"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {/* JSON */}

      {inputMode === "json" && (
        <div className="border rounded-2xl p-5">
          <label className="text-xs text-gray-500">
            Product JSON
          </label>

          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(
                e.target.value,
              );

              setJsonError("");
            }}
            placeholder="Paste JSON produk di sini..."
            className="border p-3 rounded-xl w-full min-h-72 font-mono text-xs mt-2"
          />

          {jsonError && (
            <p className="mt-2 text-xs text-red-500">
              {jsonError}
            </p>
          )}

          {jsonProductData &&
            !jsonError && (
              <p className="mt-2 text-xs text-green-600">
                JSON berhasil masuk
                ke form.
              </p>
            )}

          <button
            type="button"
            onClick={
              parseJsonProduct
            }
            className="mt-3 border border-black px-4 py-2 rounded-lg text-sm"
          >
            Import JSON ke Form
          </button>
        </div>
      )}

      {/* BASIC PRODUCT */}

      <div className="border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">
          Product Information
        </h2>

        <div>
          <label className="text-xs text-gray-500">
            Product ID
          </label>

          <input
            name="id"
            placeholder="prod-01"
            value={form.id}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Slug
          </label>

          <input
            name="slug"
            placeholder="cctv-bohlam-wireless"
            value={form.slug}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Product Name
          </label>

          <input
            name="title"
            placeholder="Name Product"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Description
          </label>

          <textarea
            name="description"
            placeholder="Describe your product..."
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">
              Selling Price
            </label>

            <input
              name="price"
              type="number"
              placeholder="100000"
              value={form.price}
              onChange={handleChange}
              className="border p-2 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Cost Product
            </label>

            <input
              name="cost"
              type="number"
              placeholder="50000"
              value={form.cost}
              onChange={handleChange}
              className="border p-2 rounded-lg w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Stock
          </label>

          <input
            name="stock"
            type="number"
            placeholder="Optional"
            value={form.stock}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Category
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded-lg w-full"
          >
            <option value="">
              Select category
            </option>

            {CATEGORY_OPTIONS.map(
              (cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {cat.name}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* IMAGES */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">
            Product Images
          </h2>

          <p className="text-sm text-gray-500">
            Maksimal 10 gambar.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {images.map(
            (img, index) => (
              <div
                key={`${img}-${index}`}
                className="relative w-24 h-24 border rounded-xl overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Product ${
                    index + 1
                  }`}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveImage(
                      index,
                    )
                  }
                  className="absolute top-1 right-1 bg-white text-red-500 rounded-full px-2 py-1 text-xs"
                >
                  ×
                </button>
              </div>
            ),
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste image URL..."
            value={imageUrlInput}
            onChange={(e) =>
              setImageUrlInput(
                e.target.value,
              )
            }
            className="border p-2 rounded-lg flex-1"
          />

          <button
            type="button"
            onClick={
              handleAddImage
            }
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
          comparePriceEnabled={
            form.settings
              .comparePrice
          }
          onAddBundle={
            handleAddBundle
          }
          onBundleChange={
            handleBundleChange
          }
          onRemoveBundle={
            handleRemoveBundle
          }
        />
      </div>

      {/* CHECKOUT */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">
            🛒 Checkout Settings
          </h2>

          <p className="text-sm text-gray-500">
            Fitur yang tersedia
            pada checkout.
          </p>
        </div>

        <div className="space-y-3">
          {CHECKOUT_SETTINGS.map(
            (feature) => (
              <FeatureToggle
                key={feature.key}
                title={
                  feature.title
                }
                description={
                  feature.description
                }
                value={
                  form.settings
                    .checkout[
                    feature.key
                  ]
                }
                onChange={(value) =>
                  handleToggle(
                    "checkout",
                    feature.key,
                    value,
                  )
                }
              />
            ),
          )}
        </div>
      </div>

      {/* AUTOMATION */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">
            🤖 Automation Settings
          </h2>

          <p className="text-sm text-gray-500">
            Automation hanya
            berjalan jika
            diaktifkan untuk
            product ini.
          </p>
        </div>

        <div className="space-y-3">
          {AUTOMATION_SETTINGS.map(
            (feature) => (
              <FeatureToggle
                key={feature.key}
                title={
                  feature.title
                }
                description={
                  feature.description
                }
                value={
                  form.settings
                    .automation[
                    feature.key
                  ]
                }
                onChange={(value) =>
                  handleToggle(
                    "automation",
                    feature.key,
                    value,
                  )
                }
              />
            ),
          )}
        </div>
      </div>

      {/* GENERAL */}

      <div className="border rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">
            ⚙️ General Settings
          </h2>
        </div>

        <div className="space-y-3">
          {GENERAL_SETTINGS.map(
            (feature) => (
              <FeatureToggle
                key={feature.key}
                title={
                  feature.title
                }
                description={
                  feature.description
                }
                value={
                  form.settings[
                    feature.key
                  ]
                }
                onChange={(value) =>
                  handleGeneralToggle(
                    feature.key,
                    value,
                  )
                }
              />
            ),
          )}
        </div>

        {form.settings
          .countdown && (
          <div>
            <label className="text-sm font-medium">
              Countdown Duration
            </label>

            <input
              type="number"
              min="1"
              value={
                form.settings
                  .countdownMinute
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,

                  settings: {
                    ...prev.settings,

                    countdownMinute:
                      Number(
                        e.target
                          .value,
                      ),
                  },
                }))
              }
              className="border rounded-lg p-2 w-full mt-1"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium">
            Max Order
          </label>

          <input
            type="number"
            min="1"
            value={
              form.settings
                .maxOrder
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,

                settings: {
                  ...prev.settings,

                  maxOrder:
                    Number(
                      e.target
                        .value,
                    ),
                },
              }))
            }
            className="border rounded-lg p-2 w-full mt-1"
          />
        </div>
      </div>

      {/* DEBUG */}

      <div className="border rounded-2xl p-5 bg-gray-50">
        <h2 className="font-semibold mb-2">
          🔍 Settings Preview
        </h2>

        <pre className="text-xs overflow-auto">
          {JSON.stringify(
            form.settings,
            null,
            2,
          )}
        </pre>
      </div>

      {/* SAVE */}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-black text-white p-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Save Product 🚀"}
      </button>
    </div>
  );
}