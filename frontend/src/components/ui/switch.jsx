import * as React from "react";

export function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
