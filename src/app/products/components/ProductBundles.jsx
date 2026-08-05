"use client";

import ProductBundleCard from "./ProductBundleCard";

export default function ProductBundles({
  bundles,
  comparePriceEnabled,
  onAddBundle,
  onBundleChange,
  onRemoveBundle,
}) {
  return (
    <section className="bg-white rounded-2xl border p-6">

      <div className="flex justify-between items-center mb-5">

        <div>

          <h2 className="font-semibold">
            Bundle Packages
          </h2>

          <p className="text-sm text-gray-500">
            Paket pembelian produk.
          </p>

        </div>

        <button
          onClick={onAddBundle}
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          + Bundle
        </button>

      </div>

      <div className="space-y-4">

        {bundles.map((bundle,index)=>(
          <ProductBundleCard
            key={bundle.id}
            bundle={bundle}
            comparePriceEnabled={comparePriceEnabled}
            onDelete={()=>onRemoveBundle(index)}
            onChange={(field,value)=>
              onBundleChange(index,field,value)
            }
          />
        ))}

      </div>

    </section>
  );
}