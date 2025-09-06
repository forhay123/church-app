import React, { useEffect, useState } from "react";
import { fetchMyGistAttendance, fetchGistCenter } from "../../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function GistUserPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gistCenter, setGistCenter] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isGistMember, setIsGistMember] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 GistUserPage: fetchData started");

      try {
        // Get user from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : {};
        console.log("ℹ️ User from localStorage:", user);

        setUserName(user.name || "Guest");

        // Fetch attendance first
        console.log("📡 Fetching my Gist attendance...");
        const attendanceData = await fetchMyGistAttendance();
        console.log("📌 Attendance Data:", attendanceData);

        if (attendanceData && attendanceData.length > 0) {
          setIsGistMember(true);
          setAttendanceRecords(attendanceData);

          // Get the centerId from the first attendance record
          const centerId = attendanceData[0].gist_center_id;
          console.log("📡 Fetching Gist center with ID:", centerId);
          const centerData = await fetchGistCenter(centerId);
          console.log("📌 Gist Center Data:", centerData);
          setGistCenter(centerData || null);
        } else {
          console.warn("⚠️ User has no attendance records");
          setIsGistMember(false);
        }
      } catch (err) {
        console.error("❌ Error fetching Gist data:", err);
        setError(
          err.response?.data?.detail ||
          err.message ||
          "An error occurred while fetching data."
        );
      } finally {
        console.log("⏹ fetchData finished");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!isGistMember) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome, {userName}!</h2>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-muted-foreground">
              You are not currently a member of a Gist Center.
            </h3>
            <p className="text-lg">
              To join a Gist Center and track your attendance, please get in touch with one of the Gist Center leaders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Welcome to {gistCenter?.name || "Your Gist Center"}!
      </h2>
      <p className="text-center text-muted-foreground mb-6">
        Here are your recent attendance records.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.attended_on || record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>Present</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No attendance records found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GistUserPage;
