"use client";

export default function ProductBasicInfo({
  form,
  onChange,
}) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">

      <div className="mb-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Product Information
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Informasi dasar produk.
        </p>
      </div>

      <div className="grid gap-5">

        {/* PRODUCT ID */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Product ID
          </label>

          <input
            name="id"
            value={form.id}
            onChange={onChange}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl p-3 w-full mt-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* PRODUCT NAME */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Name
          </label>

          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl p-3 w-full mt-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* PRICE */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* SELLING PRICE */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selling Price
            </label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={onChange}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 w-full mt-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* PRODUCT COST */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Cost
            </label>

            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={onChange}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 w-full mt-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

        </div>

      </div>

    </section>
  );
}