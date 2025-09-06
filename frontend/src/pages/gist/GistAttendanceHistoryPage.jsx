import React, { useEffect, useState } from "react";
import {
  fetchGistCenterByLeader,
  fetchGistAttendanceHistory,
  fetchCenterMembers,
} from "@utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

function GistAttendanceHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gistCenter, setGistCenter] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [memberMap, setMemberMap] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user || user.role.toUpperCase() !== "GIST_HEAD") {
          setError("Access Denied: You are not a Gist leader.");
          return;
        }

        const centerData = await fetchGistCenterByLeader(user.id);
        if (!centerData) {
          setError("No Gist Center found for this leader.");
          return;
        }
        setGistCenter(centerData);

        // Fetch center members
        const membersData = await fetchCenterMembers(centerData.id);
        setMembers(membersData);

        // Build member lookup map
        const userLookup = {};
        membersData.forEach((m) => {
          userLookup[m.id] = m.name;
        });
        setMemberMap(userLookup);

        // Fetch attendance AFTER members are set
        await fetchAttendance(centerData.id, selectedDate, membersData);
      } catch (err) {
        console.error("Error fetching attendance history:", err);
        setError(err.response?.data?.detail || err.message || "Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedDate]);

  const fetchAttendance = async (centerId, dateStr, membersData) => {
    try {
      const historyData = await fetchGistAttendanceHistory(centerId);

      // Filter attendance for selected date
      const filtered = historyData.filter(
        (record) => record.attended_on.split("T")[0] === dateStr
      );

      // Mark absent members
      const attendedIds = filtered.map((r) => r.user_id);
      const allRecords = membersData.map((m) => ({
        user_id: m.id,
        attended_on: dateStr,
        status: attendedIds.includes(m.id) ? "present" : "absent",
      }));

      setAttendanceRecords(allRecords);
    } catch (err) {
      console.error("Failed to fetch attendance for selected date:", err);
      setError("Failed to fetch attendance for selected date.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading attendance history...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {gistCenter ? `${gistCenter.name} Attendance History` : "Attendance History"}
      </h2>

      <div className="mb-6 text-center flex justify-center items-center gap-2">
        <label className="font-medium">Select Date:</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.user_id}>
                      <TableCell>{memberMap[record.user_id] || "Unknown"}</TableCell>
                      <TableCell>{format(new Date(record.attended_on), "PPP")}</TableCell>
                      <TableCell
                        className={
                          record.status === "present"
                            ? "text-green-500 font-medium"
                            : "text-red-500 font-medium"
                        }
                      >
                        {record.status === "present" ? "Present" : "Absent"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No attendance records found for this date.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GistAttendanceHistoryPage;
