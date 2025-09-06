
import React from "react";

export default function AttendanceTable({ data }) {
  return (
    <table className="table-auto w-full border border-gray-300 dark:border-gray-700">
      <thead>
        <tr>
          <th className="border p-2">Name</th>
          <th className="border p-2">Date</th>
          <th className="border p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((row, i) => (
          <tr key={i}>
            <td className="border p-2">{row.name}</td>
            <td className="border p-2">{row.date}</td>
            <td className="border p-2">{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
