import * as React from "react";

export function Checkbox({ checked, onCheckedChange }) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}
