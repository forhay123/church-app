import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminAttendanceAnalytics() {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });

  useEffect(() => {
    axios.get("/api/attendance/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
        Attendance Analytics
      </h2>

      <ul className="space-y-2 text-gray-700 dark:text-gray-200">
        <li>Total Users: <strong>{stats.total}</strong></li>
        <li>Present: <strong>{stats.present}</strong></li>
        <li>Absent: <strong>{stats.absent}</strong></li>
      </ul>
    </section>
  );
}
