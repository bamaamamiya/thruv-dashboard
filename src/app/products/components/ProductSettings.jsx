"use client";

import FeatureToggle from "./FeatureToggle";

export default function ProductSettings({
  settings,
  settingList,
  onToggle,
}) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">

      <div className="mb-5">

        <h2 className="font-semibold text-gray-900 dark:text-white">
          Product Features
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aktifkan fitur yang digunakan.
        </p>

      </div>

      <div className="space-y-3">

        {settingList.map((item) => (
          <FeatureToggle
            key={item.key}
            title={item.title}
            description={item.description}
            value={settings[item.key]}
            onChange={(value) =>
              onToggle(item.key, value)
            }
          />
        ))}

      </div>

    </section>
  );
}