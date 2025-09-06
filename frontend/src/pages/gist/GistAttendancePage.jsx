import React, { useEffect, useState } from "react";
import {
  fetchCenterMembers,
  fetchGistCenterByLeader,
  takeGistAttendance,
  removeGistAttendance,
  fetchGistAttendanceHistory,
} from "@utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // ✅ correct import
import { Input } from "@/components/ui/input";   // ✅ styled input
import { Check } from "lucide-react";

function GistAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gistCenter, setGistCenter] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // "present", "absent", or "updating"
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // default today

  useEffect(() => {
    const fetchGistData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user || user.role.toUpperCase() !== "GIST_HEAD") {
          setError("Access Denied: You are not a Gist leader.");
          setLoading(false);
          return;
        }

        const centerData = await fetchGistCenterByLeader(user.id);
        setGistCenter(centerData);

        const membersData = await fetchCenterMembers(centerData.id);
        setMembers(membersData);

        await fetchAttendance(centerData.id, selectedDate);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchGistData();
  }, [selectedDate]);

  // Fetch attendance for a given date
  const fetchAttendance = async (centerId, dateStr) => {
    try {
      const attendanceData = await fetchGistAttendanceHistory(centerId);

      const statusMap = {};
      attendanceData.forEach((record) => {
        const recordDate = record.attended_on.split("T")[0];
        if (recordDate === dateStr) {
          statusMap[record.user_id] = "present";
        }
      });
      setAttendanceStatus(statusMap);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch attendance for selected date.");
    }
  };

  const toggleAttendance = async (member) => {
    const isPresent = attendanceStatus[member.id] === "present";
    setAttendanceStatus((prev) => ({ ...prev, [member.id]: "updating" }));

    const payload = {
      gist_center_id: gistCenter.id,
      user_id: member.id,
      attended_on: selectedDate,
    };

    try {
      if (isPresent) {
        await removeGistAttendance(payload);
        setAttendanceStatus((prev) => ({ ...prev, [member.id]: "absent" }));
      } else {
        await takeGistAttendance(payload);
        setAttendanceStatus((prev) => ({ ...prev, [member.id]: "present" }));
      }
    } catch (err) {
      console.error(err);
      setAttendanceStatus((prev) => ({ ...prev, [member.id]: isPresent ? "present" : "absent" }));
      setError("Failed to update attendance. Please try again.");
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading members...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {gistCenter ? `Attendance for ${gistCenter.name}` : "Gist Attendance"}
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
          <CardTitle>Member List</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant={attendanceStatus[member.id] === "present" ? "destructive" : "default"}
                          onClick={() => toggleAttendance(member)}
                          disabled={attendanceStatus[member.id] === "updating"}
                        >
                          {attendanceStatus[member.id] === "present" ? (
                            <div className="flex items-center text-green-500">
                              <Check className="h-4 w-4 mr-2" /> Present
                            </div>
                          ) : attendanceStatus[member.id] === "updating" ? (
                            "Updating..."
                          ) : (
                            "Mark Present"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No members found for this Gist Center.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GistAttendancePage;
