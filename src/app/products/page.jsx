"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
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

      // update UI tanpa reload
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-gray-500">
            Manage your products and pricing
          </p>
        </div>

        <Link href="/products/new">
          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
            Add product
          </button>
        </Link>
      </div>

      {/* TABLE STYLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* HEADER TABLE */}
        <div className="grid grid-cols-6 px-6 py-3 text-xs text-gray-500 border-b">
          <span className="col-span-2">Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* ROWS */}
        {products.map((p) => {
          const price = p.pricing?.price || 0;
          const cost = p.pricing?.cost || 0;
          const profit = price - cost;

          return (
            <div
              key={p.id}
              className="grid grid-cols-6 items-center px-6 py-4 border-b hover:bg-gray-50 transition"
            >
              {/* PRODUCT */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">Profit: Rp {profit}</p>
                </div>
              </div>

              {/* CATEGORY */}
              <span className="text-sm text-gray-600">{p.category || "-"}</span>

              {/* PRICE */}
              <span className="text-sm font-medium">Rp {price}</span>

              {/* STATUS */}
              <div className="flex flex-col gap-1">
                {/* PRODUCT STATUS */}
                <span
                  className={`text-xs px-2 py-1 rounded-full w-fit ${
                    p.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {p.isActive ? "Active" : "Draft"}
                </span>

                {/* UPSELL STATUS */}
                <div className="flex items-center gap-1 text-xs">
                  {p.upsellEnabled ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-green-600">Upsell</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-gray-400" />
                      <span className="text-gray-500">No Upsell</span>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION */}
              <div className="flex justify-end gap-3 items-center">
                {/* EDIT */}
                <Link href={`/products/${p.id}`}>
                  <button className="text-gray-500 hover:text-black">
                    <Pencil size={16} />
                  </button>
                </Link>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No products yet</div>
        )}
      </div>
    </div>
  );
}
