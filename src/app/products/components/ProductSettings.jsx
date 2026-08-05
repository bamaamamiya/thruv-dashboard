"use client";

import FeatureToggle from "./FeatureToggle";

export default function ProductSettings({
  settings,
  settingList,
  onToggle,
}) {
  return (
    <section className="bg-white rounded-2xl border p-6">

      <div className="mb-5">

        <h2 className="font-semibold">
          Product Features
        </h2>

        <p className="text-sm text-gray-500">
          Aktifkan fitur yang digunakan.
        </p>

      </div>

      <div className="space-y-3">

        {settingList.map((item)=>(
          <FeatureToggle
            key={item.key}
            title={item.title}
            description={item.description}
            value={settings[item.key]}
            onChange={(value)=>
              onToggle(item.key,value)
            }
          />
        ))}

      </div>

    </section>
  );
}