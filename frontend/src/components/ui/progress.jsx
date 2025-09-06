import React from "react";

export default function Progress({ value = 0, max = 100, color = "bg-blue-500" }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
        className={`${color} h-4 rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
