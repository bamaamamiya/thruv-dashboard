//products/[id]/page.jsx
"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { X, CheckCircle2, XCircle } from "lucide-react";
import FeatureToggle from "@/app/products/components/FeatureToggle";

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
      description: "Halaman upsell setelah checkout",
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
      description: "Hitung ongkir",
    },
    {
      key: "saveLead",
      title: "Save Lead",
      description: "Simpan lead",
    },
    {
      key: "aiAgent",
      title: "AI Agent",
      description: "AI Customer Service",
    },
  ];

  const productRef = doc(db, "products", id);

  const fetchProduct = async () => {
    const snapshot = await getDoc(productRef);

    if (snapshot.exists()) {
      const data = snapshot.data();

      setForm({
        id: data.id || id,
        title: data.title || "",
        price: data.pricing?.price || "",
        cost: data.pricing?.cost || "",
        upsells: (data.upsells || []).map((u, i) => ({
          id: u.id || `upsell-${i}`,
          title: u.title || "",
          code: u.code || "",
          price: u.price || "",
          cost: u.cost || "",
        })),
        settings: {
          bundle: data.settings?.bundle ?? true,
          upsell: data.settings?.upsell ?? false,
          cod: data.settings?.cod ?? true,
          bankTransfer: data.settings?.bankTransfer ?? true,
          ongkir: data.settings?.ongkir ?? true,
          comparePrice: data.settings?.comparePrice ?? true,
          aiAgent: data.settings?.aiAgent ?? false,

          countdown: data.settings?.countdown ?? false,
          countdownMinute: data.settings?.countdownMinute ?? 15,

          showStock: data.settings?.showStock ?? true,

          maxOrder: data.settings?.maxOrder ?? 3,

          saveLead: data.settings?.saveLead ?? true,
        },
      });

      setImages(data.images || []);
      setBundles(
        (data.bundles || []).map((bundle) => ({
          id: bundle.id,
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
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUpsell = () => {
    if (!form.settings.upsell) return;

    setForm((prev) => ({
      ...prev,
      upsells: [
        ...prev.upsells,
        {
          id: "",
          title: "",
          code: "",
          price: "",
          cost: "",
        },
      ],
    }));
  };

  const handleUpsellChange = (index, field, value) => {
    if (!form.settings.upsell) return;

    const updated = [...form.upsells];
    updated[index][field] = value;
    setForm({ ...form, upsells: updated });
  };

  const handleRemoveUpsell = (index) => {
    const updated = form.upsells.filter((_, i) => i !== index);
    setForm({ ...form, upsells: updated });
  };

  const handleAddBundle = () => {
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
  };

  const handleBundleChange = (index, field, value) => {
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
  };

  const handleRemoveBundle = (index) => {
    setBundles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;

    if (images.length >= 10) {
      alert("Maksimal 10 gambar");
      return;
    }

    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleUpdate = async () => {
    if (!form.id) {
      alert("Product ID tidak boleh kosong");
      return;
    }

    setLoading(true);

    try {
      const newId = form.id;

      const newData = {
        id: newId,
        title: form.title,
        settings: form.settings,
        pricing: {
          price: form.price ? Number(form.price) : null,
          cost: Number(form.cost),
        },
        upsells: form.upsells.map((u) => ({
          id: u.id,
          title: u.title || "",
          code: u.code?.toLowerCase() || "",
          price: Number(u.price),
          cost: Number(u.cost),
        })),
        images: images,
        bundles,
        updatedAt: Timestamp.now(),
      };

      if (newId !== id) {
        const newRef = doc(db, "products", newId);
        await setDoc(newRef, newData);
        await deleteDoc(productRef);
      } else {
        await updateDoc(productRef, newData);
      }

      alert("Updated 🚀");
    } catch (err) {
      console.error(err);
      alert("Error update");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Edit Product</h1>

      <div className="bg-white p-6 rounded-2xl shadow grid gap-6">
        {/* IMAGES */}
        <div>
          <label className="text-xs text-gray-500">
            Gambar Produk ({images.length}/10)
          </label>

          <div className="flex gap-3 mt-2 flex-wrap">
            {images.map((img, index) => (
              <div
                key={index}
                className="w-20 h-20 relative border rounded-xl overflow-hidden"
              >
                <img src={img} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-white p-1 rounded-full"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>

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

        {/* BASIC INFO */}
        <div>
          <label className="text-xs text-gray-500">Product ID</label>
          <input
            name="id"
            placeholder="Product ID"
            value={form.id}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />
          <label className="text-xs text-gray-500">Product Name</label>

          <input
            name="title"
            placeholder="Product Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />
          <label className="text-xs text-gray-500">Price</label>

          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />
          <label className="text-xs text-gray-500">Cost</label>

          <input
            name="cost"
            type="number"
            placeholder="Cost"
            value={form.cost}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="border rounded-2xl p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Bundles</h2>

            <button
              onClick={handleAddBundle}
              className="bg-black text-white px-3 py-2 rounded"
            >
              + Add Bundle
            </button>
          </div>

          {bundles.map((bundle, index) => (
            <div
              key={bundle.id}
              className="border rounded-xl p-4 mb-3 space-y-2"
            >
              <label className="text-xs text-gray-500">Bundle Name</label>

              <input
                className="border p-2 rounded w-full"
                placeholder="Bundle Name"
                value={bundle.title}
                onChange={(e) =>
                  handleBundleChange(index, "title", e.target.value)
                }
              />
              <label className="text-xs text-gray-500">Quantity</label>

              <input
                className="border p-2 rounded w-full"
                type="number"
                placeholder="Quantity"
                value={bundle.quantity}
                onChange={(e) =>
                  handleBundleChange(index, "quantity", e.target.value)
                }
              />
              <label className="text-xs text-gray-500">
                Badge : (best seller)
              </label>
              <input
                className="border p-2 rounded w-full"
                placeholder="Badge"
                value={bundle.badge}
                onChange={(e) =>
                  handleBundleChange(index, "badge", e.target.value)
                }
              />
              <label className="text-xs text-gray-500">Selling Price</label>

              <input
                className="border p-2 rounded w-full"
                type="number"
                placeholder="Selling Price"
                value={bundle.pricing?.price ?? 0}
                onChange={(e) =>
                  handleBundleChange(index, "price", e.target.value)
                }
              />
              <label className="text-xs text-gray-500">Cost</label>

              <input
                className="border p-2 rounded w-full"
                type="number"
                placeholder="Cost"
                value={bundle.pricing?.cost ?? 0}
                onChange={(e) =>
                  handleBundleChange(index, "cost", e.target.value)
                }
              />
              <label className="text-xs text-gray-500">
                Subtitle ( Hemat 10% )
              </label>

              <input
                className="border p-2 rounded w-full"
                placeholder="subtitle"
                value={bundle.subtitle}
                onChange={(e) =>
                  handleBundleChange(index, "subtitle", e.target.value)
                }
              />
              {form.settings.comparePrice && (
                <>
                  <label className="text-xs text-gray-500">Compare Price</label>

                  <input
                    className="border p-2 rounded w-full"
                    type="number"
                    value={bundle.comparePrice}
                    onChange={(e) =>
                      handleBundleChange(index, "comparePrice", e.target.value)
                    }
                  />
                </>
              )}

              <button
                onClick={() => handleRemoveBundle(index)}
                className="text-red-500 text-sm"
              >
                Delete Bundle
              </button>
            </div>
          ))}
        </div>

        <div className="border rounded-2xl p-5 space-y-5 bg-white">
          <div>
            <h2 className="font-semibold text-lg">⚙ Product Settings</h2>

            <p className="text-sm text-gray-500">
              Atur fitur yang digunakan produk ini.
            </p>
          </div>

          <div className="space-y-3">
            {SETTING_LIST.map((setting) => (
              <FeatureToggle
                key={setting.key}
                title={setting.title}
                description={setting.description}
                value={form.settings[setting.key]}
                onChange={(value) =>
                  setForm({
                    ...form,
                    settings: {
                      ...form.settings,
                      [setting.key]: value,
                    },
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* UPSSELL LIST */}
        <div
          className={`transition ${
            !form.settings.upsell ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <h2 className="text-sm font-semibold mb-2">Upsell Products</h2>

          {form.upsells.map((u, index) => (
            <div
              key={index}
              className="border p-3 rounded mt-2 relative bg-white"
            >
              <button
                onClick={() => handleRemoveUpsell(index)}
                className="absolute top-2 right-2"
              >
                <X size={14} className="text-red-500" />
              </button>

              <input
                placeholder="Upsell ID"
                value={u.id}
                onChange={(e) =>
                  handleUpsellChange(index, "id", e.target.value)
                }
                className="border p-2 rounded w-full mb-2"
              />

              <input
                placeholder="Title"
                value={u.title}
                onChange={(e) =>
                  handleUpsellChange(index, "title", e.target.value)
                }
                className="border p-2 rounded w-full mb-2"
              />

              <input
                placeholder="Code"
                value={u.code}
                onChange={(e) =>
                  handleUpsellChange(index, "code", e.target.value)
                }
                className="border p-2 rounded w-full mb-2"
              />

              <input
                type="number"
                placeholder="Price"
                value={u.price}
                onChange={(e) =>
                  handleUpsellChange(index, "price", e.target.value)
                }
                className="border p-2 rounded w-full mb-2"
              />

              <input
                type="number"
                placeholder="Cost"
                value={u.cost}
                onChange={(e) =>
                  handleUpsellChange(index, "cost", e.target.value)
                }
                className="border p-2 rounded w-full"
              />
            </div>
          ))}

          <button onClick={handleAddUpsell} className="text-blue-600 mt-2">
            + Add Upsell
          </button>
        </div>

        {/* SAVE */}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="bg-black text-white p-2 rounded mt-4"
        >
          {loading ? "Saving..." : "Update Product"}
        </button>
      </div>
    </div>
  );
}
