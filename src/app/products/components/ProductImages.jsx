"use client";

import { X } from "lucide-react";

export default function ProductImages({
  images,
  imageUrlInput,
  setImageUrlInput,
  onAddImage,
  onRemoveImage,
}) {
  return (
    <section className="bg-white rounded-2xl border p-6">
      <div className="mb-5">
        <h2 className="font-semibold">Product Images</h2>

        <p className="text-sm text-gray-500">
          Maksimal 10 gambar.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative w-24 h-24 rounded-xl border overflow-hidden"
          >
            <img
              src={img}
              className="w-full h-full object-cover"
            />

            <button
              onClick={() => onRemoveImage(index)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-5">
        <input
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          placeholder="Paste Image URL..."
          className="flex-1 border rounded-xl px-4 py-2"
        />

        <button
          onClick={onAddImage}
          className="px-5 rounded-xl bg-black text-white"
        >
          Add
        </button>
      </div>
    </section>
  );
}