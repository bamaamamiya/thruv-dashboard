"use client";

export default function ProductActions({
  loading,
  onSave,
}) {
  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 transition-colors">

      <button
        onClick={onSave}
        disabled={loading}
        className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Update Product"}
      </button>

    </div>
  );
}