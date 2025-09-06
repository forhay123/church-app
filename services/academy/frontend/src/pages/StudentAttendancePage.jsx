import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  BookOpen,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchMyAttendance } from "../services/api";

const StudentAttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await fetchMyAttendance();
        setAttendance(data || []);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="p-6 sm:p-10 bg-background min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          My Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          View your daily attendance records.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 animate-spin" />
                <span>Loading attendance...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-border bg-card">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.length > 0 ? (
                attendance.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {new Date(record.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        record.status === "Present"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {record.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {record.remarks || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;
