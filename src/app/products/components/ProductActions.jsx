"use client";

export default function ProductActions({
  loading,
  onSave,
}) {
  return (
    <div className="sticky bottom-0 bg-white border rounded-2xl p-5">

      <button
        onClick={onSave}
        disabled={loading}
        className="w-full bg-black text-white rounded-xl py-3"
      >
        {loading ? "Saving..." : "Update Product"}
      </button>

    </div>
  );
}