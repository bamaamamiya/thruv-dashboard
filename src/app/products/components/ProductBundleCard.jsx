"use client";

export default function ProductBundleCard({
  bundle,
  comparePriceEnabled,
  onChange,
  onDelete,
}) {
  const inputClass =
    "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

  return (
    <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-4 transition-colors">

      {/* BUNDLE NAME */}
      <input
        placeholder="Bundle Name"
        value={bundle.title}
        onChange={(e) => onChange("title", e.target.value)}
        className={`${inputClass} w-full`}
      />

      {/* SUBTITLE */}
      <input
        placeholder="Subtitle"
        value={bundle.subtitle}
        onChange={(e) => onChange("subtitle", e.target.value)}
        className={`${inputClass} w-full`}
      />

      {/* BUNDLE DATA */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* QUANTITY */}
        <input
          type="number"
          value={bundle.quantity}
          placeholder="Qty"
          onChange={(e) => onChange("quantity", e.target.value)}
          className={inputClass}
        />

        {/* BADGE */}
        <input
          value={bundle.badge}
          placeholder="Badge"
          onChange={(e) => onChange("badge", e.target.value)}
          className={inputClass}
        />

        {/* PRICE */}
        <input
          type="number"
          value={bundle.pricing.price}
          placeholder="Price"
          onChange={(e) => onChange("price", e.target.value)}
          className={inputClass}
        />

        {/* COST */}
        <input
          type="number"
          value={bundle.pricing.cost}
          placeholder="Cost"
          onChange={(e) => onChange("cost", e.target.value)}
          className={inputClass}
        />

      </div>

      {/* COMPARE PRICE */}
      {comparePriceEnabled && (
        <input
          type="number"
          value={bundle.comparePrice}
          placeholder="Compare Price"
          onChange={(e) =>
            onChange("comparePrice", e.target.value)
          }
          className={`${inputClass} w-full`}
        />
      )}

      {/* DELETE */}
      <button
        type="button"
        onClick={onDelete}
        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm transition-colors"
      >
        Delete Bundle
      </button>

    </div>
  );
}