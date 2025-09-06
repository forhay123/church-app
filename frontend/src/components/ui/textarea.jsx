import React from "react";

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-md border border-gray-300 dark:border-gray-700 
        bg-white dark:bg-gray-900 p-2 text-sm text-gray-900 dark:text-gray-100 
        focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}
