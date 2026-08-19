// products/page.jsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  const productsRef = collection(db, "products");

  const fetchProducts = async () => {
    const snapshot = await getDocs(productsRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Yakin mau hapus produk ini?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", id));

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8 transition-colors">
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Products
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your products and pricing
          </p>
        </div>

        <Link href="/products/new" className="shrink-0">
          <button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition">
            Add product
          </button>
        </Link>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-colors">

        {/* HEADER TABLE */}
        <div className="grid grid-cols-7 px-6 py-3 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
          <span className="col-span-2">Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Economics</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* ROWS */}
        {products.map((p) => {
          const price = p.pricing?.price || 0;
          const cost = p.pricing?.cost || 0;
          const profit = price - cost;

          const features = p.features || {};

          const bundleEnabled = features.bundle ?? false;
          const upsellEnabled = features.upsell ?? false;

          return (
            <div
              key={p.id}
              className="grid grid-cols-7 items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >

              {/* PRODUCT */}
              <div className="col-span-2 flex items-center gap-3 min-w-0">

                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden shrink-0">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {p.title}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Profit: Rp {profit.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* CATEGORY */}
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {p.category || "-"}
              </span>

              {/* PRICE */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Rp {price.toLocaleString("id-ID")}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  HPP: Rp {cost.toLocaleString("id-ID")}
                </span>
              </div>

              {/* ECONOMICS */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Contribution
                </span>

                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Rp {profit.toLocaleString("id-ID")}
                </span>

                <span className="text-xs text-green-600 dark:text-green-400">
                  BE CAC: Rp {profit.toLocaleString("id-ID")}
                </span>
              </div>

              {/* STATUS */}
              <div className="flex flex-col gap-1">

                <span
                  className={`text-xs px-2 py-1 rounded-full w-fit ${
                    p.isActive
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {p.isActive ? "Active" : "Draft"}
                </span>

                {/* UPSELL */}
                <div className="flex items-center gap-1 text-xs">
                  {upsellEnabled ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        Upsell
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-gray-400 dark:text-gray-600" />
                      <span className="text-gray-500 dark:text-gray-500">
                        No Upsell
                      </span>
                    </>
                  )}
                </div>

                {/* BUNDLE */}
                <div className="flex items-center gap-1 text-xs">
                  {bundleEnabled ? (
                    <>
                      <CheckCircle2 size={14} className="text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">
                        Bundle
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-gray-400 dark:text-gray-600" />
                      <span className="text-gray-500 dark:text-gray-500">
                        No Bundle
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION */}
              <div className="flex justify-end gap-3 items-center">

                <Link href={`/products/${p.id}`}>
                  <button className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition">
                    <Pencil size={16} />
                  </button>
                </Link>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No products yet
          </div>
        )}
      </div>


      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3">

        {products.map((p) => {
          const price = p.pricing?.price || 0;
          const cost = p.pricing?.cost || 0;
          const profit = price - cost;

          const features = p.features || {};

          const bundleEnabled = features.bundle ?? false;
          const upsellEnabled = features.upsell ?? false;

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-colors"
            >

              {/* TOP */}
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {p.title}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {p.category || "Uncategorized"}
                    </p>
                  </div>
                </div>

                {/* STATUS */}
                <span
                  className={`text-[11px] px-2 py-1 rounded-full shrink-0 ${
                    p.isActive
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {p.isActive ? "Active" : "Draft"}
                </span>
              </div>


              {/* DIVIDER */}
              <div className="border-t border-gray-100 dark:border-gray-800 my-4" />


              {/* PRICE + ECONOMICS */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    Selling Price
                  </p>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Rp {price.toLocaleString("id-ID")}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    HPP: Rp {cost.toLocaleString("id-ID")}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    Contribution
                  </p>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Rp {profit.toLocaleString("id-ID")}
                  </p>

                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    BE CAC: Rp {profit.toLocaleString("id-ID")}
                  </p>
                </div>

              </div>


              {/* FEATURES */}
              <div className="flex flex-wrap gap-2 mt-4">

                <span
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${
                    upsellEnabled
                      ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                >
                  {upsellEnabled ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}

                  {upsellEnabled ? "Upsell" : "No Upsell"}
                </span>


                <span
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${
                    bundleEnabled
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                >
                  {bundleEnabled ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}

                  {bundleEnabled ? "Bundle" : "No Bundle"}
                </span>

              </div>


              {/* ACTIONS */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">

                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Profit: Rp {profit.toLocaleString("id-ID")}
                </span>

                <div className="flex items-center gap-4">

                  <Link href={`/products/${p.id}`}>
                    <button
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  </Link>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>

                </div>
              </div>

            </div>
          );
        })}


        {/* EMPTY */}
        {products.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-sm text-gray-500 dark:text-gray-400">
            No products yet
          </div>
        )}

      </div>

    </div>
  </div>
);
}