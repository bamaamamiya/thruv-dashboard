import { CheckCircle2, XCircle } from "lucide-react";

export default function FeatureToggle({
  title,
  description,
  value,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between border rounded-xl p-4 bg-gray-50">
      <div>
        <p className="font-medium">{title}</p>

        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-1 text-xs font-medium">
          {value ? (
            <>
              <CheckCircle2
                size={16}
                className="text-green-500"
              />
              <span className="text-green-600">
                Active
              </span>
            </>
          ) : (
            <>
              <XCircle
                size={16}
                className="text-gray-400"
              />
              <span className="text-gray-500">
                Off
              </span>
            </>
          )}
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition ${
            value ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow transform transition ${
              value ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}