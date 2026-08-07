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

import ProductImages from "@/app/products/components/ProductImages";
import ProductBasicInfo from "@/app/products/components/ProductBasicInfo";
import ProductBundles from "@/app/products/components/ProductBundles";
import ProductSettings from "@/app/products/components/ProductSettings";
import ProductActions from "@/app/products/components/ProductActions";

export default function EditProductPage() {
  const { id } = useParams();

  const productRef = doc(db, "products", id);

  const [loading, setLoading] = useState(false);

  const [imageUrlInput, setImageUrlInput] = useState("");

  const [images, setImages] = useState([]);

  const [bundles, setBundles] = useState([]);

  const [form, setForm] = useState({
    id: "",
    title: "",
    price: "",
    cost: "",
    settings: {
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
      },
    },
  });

  const SETTING_LIST = [
    {
      key: "bundle",
      title: "Bundle",
      description: "Aktifkan pilihan paket",
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
      description: "Transfer Bank",
    },
    {
      key: "ongkir",
      title: "Shipping",
      description: "Hitung Ongkir",
    },
    {
      key: "saveLead",
      title: "Save Lead",
      description: "Simpan Lead",
    },
    {
      key: "aiAgent",
      title: "AI Agent",
      description: "AI Customer Service",
    },
  ];

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) return;

    const data = snapshot.data();

    setForm({
      id: data.id || id,
      title: data.title || "",
      price: data.pricing?.price || "",
      cost: data.pricing?.cost || "",
      settings: {
        bundle: data.settings?.bundle ?? true,
        comparePrice: data.settings?.comparePrice ?? true,
        cod: data.settings?.cod ?? true,
        bankTransfer: data.settings?.bankTransfer ?? true,
        ongkir: data.settings?.ongkir ?? true,
        saveLead: data.settings?.saveLead ?? true,
        aiAgent: data.settings?.aiAgent ?? false,
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

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleToggle(key, value) {
    setForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  }

  function handleAddImage() {
    if (!imageUrlInput.trim()) return;

    if (images.length >= 10) return;

    setImages((prev) => [...prev, imageUrlInput]);

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
    setLoading(true);

    try {
      const newId = form.id;

      const payload = {
        id: newId,
        title: form.title,
        settings: form.settings,

        pricing: {
          price: Number(form.price),
          cost: Number(form.cost),
        },

        bundles,

        images,

        updatedAt: Timestamp.now(),
      };

      if (newId !== id) {
        await setDoc(doc(db, "products", newId), payload);

        await deleteDoc(productRef);
      } else {
        await updateDoc(productRef, payload);
      }

      alert("Updated");
    } catch (err) {
      console.error(err);
      alert("Error");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <ProductImages
        images={images}
        imageUrlInput={imageUrlInput}
        setImageUrlInput={setImageUrlInput}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
      />

      <ProductBasicInfo form={form} onChange={handleChange} />

      <ProductBundles
        bundles={bundles}
        comparePriceEnabled={form.settings.comparePrice}
        onAddBundle={handleAddBundle}
        onBundleChange={handleBundleChange}
        onRemoveBundle={handleRemoveBundle}
      />

      <ProductSettings
        settings={form.settings}
        settingList={SETTING_LIST}
        onToggle={handleToggle}
      />

      <ProductActions loading={loading} onSave={handleUpdate} />
    </div>
  );
}
