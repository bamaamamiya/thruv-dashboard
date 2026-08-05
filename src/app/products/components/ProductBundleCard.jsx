"use client";

export default function ProductBundleCard({
  bundle,
  comparePriceEnabled,
  onChange,
  onDelete,
}) {
  return (
    <div className="border rounded-2xl p-5 space-y-4">

      <input
        placeholder="Bundle Name"
        value={bundle.title}
        onChange={(e)=>onChange("title",e.target.value)}
        className="border rounded-xl p-3 w-full"
      />

      <input
        placeholder="Subtitle"
        value={bundle.subtitle}
        onChange={(e)=>onChange("subtitle",e.target.value)}
        className="border rounded-xl p-3 w-full"
      />

      <div className="grid md:grid-cols-2 gap-4">

        <input
          type="number"
          value={bundle.quantity}
          placeholder="Qty"
          onChange={(e)=>onChange("quantity",e.target.value)}
          className="border rounded-xl p-3"
        />

        <input
          value={bundle.badge}
          placeholder="Badge"
          onChange={(e)=>onChange("badge",e.target.value)}
          className="border rounded-xl p-3"
        />

        <input
          type="number"
          value={bundle.pricing.price}
          placeholder="Price"
          onChange={(e)=>onChange("price",e.target.value)}
          className="border rounded-xl p-3"
        />

        <input
          type="number"
          value={bundle.pricing.cost}
          placeholder="Cost"
          onChange={(e)=>onChange("cost",e.target.value)}
          className="border rounded-xl p-3"
        />

      </div>

      {comparePriceEnabled && (
        <input
          type="number"
          value={bundle.comparePrice}
          placeholder="Compare Price"
          onChange={(e)=>onChange("comparePrice",e.target.value)}
          className="border rounded-xl p-3 w-full"
        />
      )}

      <button
        onClick={onDelete}
        className="text-red-500 text-sm"
      >
        Delete Bundle
      </button>

    </div>
  );
}