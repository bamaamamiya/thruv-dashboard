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
import { X } from "lucide-react";

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
    setForm({
      ...form,
      upsells: [
        ...form.upsells,
        { id: "", title: "", code: "", price: "", cost: "" },
      ],
    });
  };

  const handleUpsellChange = (index, field, value) => {
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

      <div className="bg-white p-6 rounded-2xl shadow grid gap-4">
        
        {/* IMAGES */}
        <div>
          <label className="text-xs text-gray-500">
            Gambar produk (untuk tampilan ke customer)
          </label>

          <div className="flex gap-3 mt-2 flex-wrap">
            {images.map((img, index) => (
              <div key={index} className="w-20 h-20 relative border rounded-xl overflow-hidden">
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
            <button onClick={handleAddImage} className="bg-black text-white px-3 rounded">
              Add
            </button>
          </div>
        </div>

        {/* ID */}
        <div>
          <label className="text-xs text-gray-500">
            Product ID (unik, dipakai untuk database & automation)
          </label>
          <input
            name="id"
            placeholder="Contoh: cctv-01"
            value={form.id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* TITLE */}
        <div>
          <label className="text-xs text-gray-500">
            Nama produk (yang dilihat customer)
          </label>
          <input
            name="title"
            placeholder="Contoh: CCTV Wireless HD"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="text-xs text-gray-500">
            Harga jual ke customer
          </label>
          <input
            name="price"
            type="number"
            placeholder="Contoh: 150000"
            value={form.price}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* COST */}
        <div>
          <label className="text-xs text-gray-500">
            Modal / harga dari supplier
          </label>
          <input
            name="cost"
            type="number"
            placeholder="Contoh: 80000"
            value={form.cost}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* UPSELL */}
        <div>
          <h2 className="text-sm font-semibold">Upsells</h2>

          {form.upsells.map((u, index) => (
            <div key={index} className="border p-3 rounded mt-2 relative">
              <button onClick={() => handleRemoveUpsell(index)} className="absolute top-2 right-2">
                <X size={14} className="text-red-500" />
              </button>

              <label className="text-xs text-gray-500">Upsell ID</label>
              <input
                value={u.id || ""}
                onChange={(e) => handleUpsellChange(index, "id", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              <label className="text-xs text-gray-500">Nama upsell</label>
              <input
                value={u.title || ""}
                onChange={(e) => handleUpsellChange(index, "title", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              <label className="text-xs text-gray-500">
                Code (dipakai untuk trigger automation/bot)
              </label>
              <input
                value={u.code || ""}
                onChange={(e) => handleUpsellChange(index, "code", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              <label className="text-xs text-gray-500">Harga jual upsell</label>
              <input
                type="number"
                value={u.price || ""}
                onChange={(e) => handleUpsellChange(index, "price", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              <label className="text-xs text-gray-500">Modal upsell</label>
              <input
                type="number"
                value={u.cost || ""}
                onChange={(e) => handleUpsellChange(index, "cost", e.target.value)}
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