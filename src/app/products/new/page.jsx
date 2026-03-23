//products/new/page.jsx
"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseClient";
import { doc, setDoc } from "firebase/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { storage } from "@/lib/firebaseClient";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { X } from "lucide-react";

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
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
  });

  const productsRef = collection(db, "products");

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
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  const handleSubmit = async () => {
    if (!form.id || !form.title || !form.price) {
      alert("ID, Title & price wajib");
      return;
    }

    if (images.length === 0) {
      alert("Minimal 1 gambar");
      return;
    }

    setLoading(true);

    try {
      const productRef = doc(db, "products", form.id);

      await setDoc(productRef, {
        id: form.id,
        slug: form.slug || "",

        title: form.title,
        description: form.description,
        category: form.category,

        images: images, // ✅ langsung pakai array

        pricing: {
          price: Number(form.price),
          cost: Number(form.cost) || 0,
        },

        stock: Number(form.stock) || 0,

        upsells: [],
        scripts: {
          opening: "",
          closing: "",
          upsell: "",
        },

        isActive: true,
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
