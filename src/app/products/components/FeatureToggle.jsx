import { CheckCircle2, XCircle } from "lucide-react";

export default function FeatureToggle({
  title,
  description,
  value,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 transition-colors">

      {/* INFO */}
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {title}
        </p>

        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* STATUS + TOGGLE */}
      <div className="flex items-center gap-3">

        {/* STATUS */}
        <div className="flex items-center gap-1 text-xs font-medium">

          {value ? (
            <>
              <CheckCircle2
                size={16}
                className="text-green-500 dark:text-green-400"
              />

              <span className="text-green-600 dark:text-green-400">
                Active
              </span>
            </>
          ) : (
            <>
              <XCircle
                size={16}
                className="text-gray-400 dark:text-gray-500"
              />

              <span className="text-gray-500 dark:text-gray-400">
                Off
              </span>
            </>
          )}

        </div>

        {/* TOGGLE */}
        <button
          type="button"
          onClick={() => onChange(!value)}
          aria-pressed={value}
          aria-label={`Toggle ${title}`}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
            value
              ? "bg-green-500"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform ${
              value
                ? "translate-x-6"
                : "translate-x-0"
            }`}
          />
        </button>

      </div>
    </div>
  );
}