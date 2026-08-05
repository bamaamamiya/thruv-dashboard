//products/new/page.jsx
"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseClient";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { X, CheckCircle2, XCircle } from "lucide-react";
import FeatureToggle from "@/app/products/components/FeatureToggle";

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [inputMode, setInputMode] = useState("form");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonProductData, setJsonProductData] = useState(null);
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

    settings: {
      bundle: true,
      upsell: false,
      cod: true,
      bankTransfer: true,
      ongkir: true,
      comparePrice: true,
      aiAgent: false,

      countdown: false,
      countdownMinute: 15,

      showStock: true,

      maxOrder: 3,

      saveLead: true,
    },
  });

  const SETTING_LIST = [
    {
      key: "bundle",
      title: "Bundle",
      description: "Aktifkan pilihan paket",
    },
    {
      key: "upsell",
      title: "Upsell",
      description: "Tampilkan halaman upsell setelah checkout",
    },
    {
      key: "comparePrice",
      title: "Compare Price",
      description: "Menampilkan harga coret",
    },
    {
      key: "cod",
      title: "COD",
      description: "Bayar di tempat",
    },
    {
      key: "bankTransfer",
      title: "Bank Transfer",
      description: "Transfer bank",
    },
    {
      key: "ongkir",
      title: "Shipping",
      description: "Hitung ongkir otomatis",
    },
    {
      key: "abandonedLead",
      title: "Abandoned Lead",
      description: "Simpan lead yang belum checkout",
    },
    {
      key: "aiAgent",
      title: "AI Agent",
      description: "Aktifkan AI untuk produk ini",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "title") {
      setForm({
        ...form,
        title: value,
        slug: generateSlug(value),
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const generateSlug = (text) => {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  const mapJsonToForm = (productData) => {
    const productId = productData.product_id || productData.id || "";
    const identity = productData.identity || {};
    const pricing = productData.pricing || {};
    const title = identity.name || productData.title || "";

    return {
      id: productId,
      slug: generateSlug(title || productId),
      title,
      description:
        identity.description_long ||
        identity.description_short ||
        productData.description ||
        "",
      price: pricing.base_price?.toString() || "",
      cost: pricing.cost?.toString() || "",
      category: identity.category || "",
      stock: productData.stock?.toString() || "",
      upsells: (pricing.upsell || []).map((item, index) => ({
        id: `${productId || "upsell"}-${index + 1}`,
        title: item.variant || "",
        code: generateSlug(item.variant || `variant-${index + 1}`),
        price: Number(pricing.base_price || 0) + Number(item.extra || 0),
        cost: 0,
      })),
      upsellEnabled: Boolean(pricing.upsell?.length),
    };
  };

  const parseJsonProduct = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const nextForm = mapJsonToForm(parsed);

      if (!nextForm.id || !nextForm.title || !nextForm.price) {
        setJsonError(
          "JSON harus punya product_id, identity.name, dan pricing.base_price.",
        );
        return null;
      }

      setForm(nextForm);
      setJsonProductData(parsed);
      setJsonError("");
      return { parsed, nextForm };
    } catch {
      setJsonError("Format JSON belum valid. Cek koma, kutip, atau kurungnya.");
      return null;
    }
  };

  const handleSubmit = async () => {
    let importedJson = jsonProductData;
    let submitForm = form;

    if (inputMode === "json") {
      const result = parseJsonProduct();
      if (!result) return;

      importedJson = result.parsed;
      submitForm = result.nextForm;
    }

    if (!submitForm.id || !submitForm.title || !submitForm.price) {
      alert("ID, Title & price wajib");
      return;
    }

    if (images.length === 0) {
      alert("Minimal 1 gambar");
      return;
    }

    setLoading(true);

    try {
      const productRef = doc(db, "products", submitForm.id);
      const identity = importedJson?.identity || {};

      await setDoc(productRef, {
        id: submitForm.id,
        slug: submitForm.slug || "",

        title: submitForm.title,
        settings: submitForm.settings,
        description: submitForm.description,
        category: submitForm.category,
        brand: identity.brand || "",
        status: identity.status || "active",

        images: images, // ✅ langsung pakai array
        pricing: {
          price: Number(submitForm.price),
          cost: Number(submitForm.cost) || 0,
          ...(importedJson?.pricing || {}),
        },

        stock: Number(submitForm.stock) || 0,

        upsells: submitForm.upsells || [],
        scripts: {
          opening: "",
          closing: "",
          upsell: "",
        },

        productData: importedJson || null,
        identity: importedJson?.identity || null,
        specification: importedJson?.specification || null,
        usage: importedJson?.usage || null,
        constraints: importedJson?.constraints || [],
        shipping: importedJson?.shipping || null,
        objections: importedJson?.objections || [],
        scenarios: importedJson?.scenarios || [],
        faq: importedJson?.faq || [],

        isActive: identity.status ? identity.status === "active" : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      alert("Product created 🚀");
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleAddImage = () => {
    if (!imageUrlInput) return;
    setImages([...images, imageUrlInput]);
    setImageUrlInput("");
  };
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>

      <div className="bg-white p-6 rounded-2xl shadow grid gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setInputMode("form")}
            className={`rounded-lg p-2 text-sm ${
              inputMode === "form"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            Form
          </button>
          <button
            onClick={() => setInputMode("json")}
            className={`rounded-lg p-2 text-sm ${
              inputMode === "json"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            JSON
          </button>
        </div>

        {inputMode === "json" && (
          <div>
            <label className="text-xs text-gray-500">Product JSON</label>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError("");
              }}
              placeholder="Paste JSON produk di sini..."
              className="border p-3 rounded w-full min-h-72 font-mono text-xs"
            />
            {jsonError && (
              <p className="mt-2 text-xs text-red-500">{jsonError}</p>
            )}
            {jsonProductData && !jsonError && (
              <p className="mt-2 text-xs text-green-600">
                JSON sudah masuk ke form. Detail lengkap akan ikut tersimpan.
              </p>
            )}
            <button
              onClick={parseJsonProduct}
              className="mt-2 border border-black px-3 py-2 rounded text-sm"
            >
              Import JSON ke Form
            </button>
          </div>
        )}

        {/* IMAGE SECTION */}
        <div>
          <label className="text-xs text-gray-500">Product Images</label>

          {/* PREVIEW */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {images.map((img, index) => (
              <div
                key={index}
                className="w-20 h-20 rounded-xl overflow-hidden relative border"
              >
                <img src={img} className="w-full h-full object-cover" />

                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-red-100"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {/* INPUT URL */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Paste image URL..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="border p-2 rounded w-full"
            />

            <button
              onClick={handleAddImage}
              className="bg-black text-white px-3 rounded"
            >
              Add
            </button>
          </div>
        </div>
        {/* PRODUCT ID */}

        <div>
          <label className="text-xs text-gray-500">Product ID</label>
          <input
            name="id"
            placeholder="prod-01"
            value={form.id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>
        {/* slug */}

        <div>
          <label className="text-xs text-gray-500">Slug (URL)</label>
          <input
            name="slug"
            placeholder="cctv-bohlam-wireless"
            value={form.slug}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* TITLE */}
        <div>
          <label className="text-xs text-gray-500">Product Name</label>
          <input
            name="title"
            placeholder="Name Product"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            name="description"
            placeholder="Describe your product..."
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="text-xs text-gray-500">Selling Price</label>
          <input
            name="price"
            type="number"
            placeholder="100000"
            value={form.price}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* COST */}
        <div>
          <label className="text-xs text-gray-500">Cost Product</label>
          <input
            name="cost"
            type="number"
            placeholder="50000"
            value={form.cost}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* STOCK */}
        <div>
          <label className="text-xs text-gray-500">Stock</label>
          <input
            name="stock"
            type="number"
            placeholder="Optional"
            value={form.stock}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* CATEGORY */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">Select category</option>

          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">⚙ Product Setting</h2>

            <p className="text-sm text-gray-500">
              Aktifkan atau nonaktifkan fitur produk.
            </p>
          </div>

          <div className="space-y-3">
            {SETTING_LIST.map((feature) => (
              <FeatureToggle
                key={feature.key}
                title={feature.title}
                description={feature.description}
                value={form.settings[feature.key]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    settings: {
                      ...form.settings,
                      [feature.key]: value,
                    },
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-black text-white p-2 rounded mt-2"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </div>
  );
}
