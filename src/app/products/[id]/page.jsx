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

export default function EditProductPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    id: "",
    title: "",
    price: "",
    cost: "",
    upsells: [],
    upsellEnabled: false,
  });

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
        upsellEnabled: data.upsellEnabled ?? false,
      });

      setImages(data.images || []);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUpsell = () => {
    if (!form.upsellEnabled) return;

    setForm({
      ...form,
      upsells: [
        ...form.upsells,
        { id: "", title: "", code: "", price: "", cost: "" },
      ],
    });
  };

  const handleUpsellChange = (index, field, value) => {
    if (!form.upsellEnabled) return;

    const updated = [...form.upsells];
    updated[index][field] = value;
    setForm({ ...form, upsells: updated });
  };

  const handleRemoveUpsell = (index) => {
    const updated = form.upsells.filter((_, i) => i !== index);
    setForm({ ...form, upsells: updated });
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
        upsellEnabled: form.upsellEnabled || false,
        images: images,
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
            Gambar produk
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
          <input
            name="id"
            placeholder="Product ID"
            value={form.id}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />

          <input
            name="title"
            placeholder="Product Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />

          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-2"
          />

          <input
            name="cost"
            type="number"
            placeholder="Cost"
            value={form.cost}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* 🔥 UPSSELL SETTINGS */}
        <div className="border rounded-2xl p-4 bg-gray-50">
          <h2 className="text-sm font-semibold mb-3">
            Upsell Settings
          </h2>

          {/* TOGGLE */}
          <div className="flex items-center justify-between border rounded-xl p-4 bg-white">
            <div>
              <p className="text-sm font-medium">Upsell Feature</p>
              <p className="text-xs text-gray-500">
                Aktifkan untuk menawarkan produk tambahan
              </p>
            </div>

            <button
              onClick={() =>
                setForm({
                  ...form,
                  upsellEnabled: !form.upsellEnabled,
                })
              }
              className={`w-14 h-8 flex items-center rounded-full p-1 transition ${
                form.upsellEnabled
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${
                  form.upsellEnabled
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* STATUS */}
          <div className="flex items-center gap-2 mt-2">
            {form.upsellEnabled ? (
              <>
                <CheckCircle2
                  className="text-green-500"
                  size={16}
                />
                <span className="text-xs text-green-600 font-medium">
                  Upsell Active
                </span>
              </>
            ) : (
              <>
                <XCircle
                  className="text-gray-400"
                  size={16}
                />
                <span className="text-xs text-gray-500">
                  Upsell Disabled
                </span>
              </>
            )}
          </div>
        </div>

        {/* UPSSELL LIST */}
        <div
          className={`transition ${
            !form.upsellEnabled
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          <h2 className="text-sm font-semibold mb-2">
            Upsell Products
          </h2>

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

          <button
            onClick={handleAddUpsell}
            className="text-blue-600 mt-2"
          >
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