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
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">

      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Bundle Packages
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Paket pembelian produk.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddBundle}
          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-xl font-medium transition-colors"
        >
          + Bundle
        </button>

      </div>

      <div className="space-y-4">

        {bundles.map((bundle, index) => (
          <ProductBundleCard
            key={bundle.id}
            bundle={bundle}
            comparePriceEnabled={comparePriceEnabled}
            onDelete={() => onRemoveBundle(index)}
            onChange={(field, value) =>
              onBundleChange(index, field, value)
            }
          />
        ))}

      </div>

    </section>
  );
}