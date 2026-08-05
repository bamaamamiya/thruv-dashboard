"use client";

export default function ProductBasicInfo({
  form,
  onChange,
}) {
  return (
    <section className="bg-white rounded-2xl border p-6">

      <div className="mb-5">
        <h2 className="font-semibold">
          Product Information
        </h2>

        <p className="text-sm text-gray-500">
          Informasi dasar produk.
        </p>
      </div>

      <div className="grid gap-5">

        <div>
          <label className="text-sm font-medium">
            Product ID
          </label>

          <input
            name="id"
            value={form.id}
            onChange={onChange}
            className="border rounded-xl p-3 w-full mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Product Name
          </label>

          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="border rounded-xl p-3 w-full mt-2"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="text-sm font-medium">
              Selling Price
            </label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={onChange}
              className="border rounded-xl p-3 w-full mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Product Cost
            </label>

            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={onChange}
              className="border rounded-xl p-3 w-full mt-2"
            />
          </div>

        </div>

      </div>

    </section>
  );
}