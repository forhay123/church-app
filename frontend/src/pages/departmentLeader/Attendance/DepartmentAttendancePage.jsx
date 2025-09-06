import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, RefreshCw, AlertCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/utils/apiClient";
import LeaderAttendanceList from "./LeaderAttendanceList";

export default function DepartmentAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await apiClient.get("/attendance/department/members");
      const attendanceData = Array.isArray(res.data) ? res.data : [];
      
      setAttendance(attendanceData);
      setLastUpdated(new Date());
      
      toast({
        title: "Success",
        description: `Loaded ${attendanceData.length} attendance records`,
      });
      
    } catch (err) {
      console.error("Error fetching department attendance:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to load attendance records.";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAttendance();
  };

  const handleExportData = () => {
    if (attendance.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const headers = ["Member Name", "Date", "Status", "Timestamp"];
      const csvContent = [
        headers.join(","),
        ...attendance.map(record => [
          `"${record.user_name || ""}"`,
          record.date || "",
          record.status || "",
          record.timestamp || ""
        ].join(","))
      ].join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `department-attendance-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Department attendance data has been exported to CSV file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Department Attendance
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor and track attendance for your department members
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {format(lastUpdated, "PPP 'at' p")}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="lg"
              disabled={loading}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button 
              onClick={handleExportData} 
              size="lg"
              className="shadow-sm hover:shadow-md transition-shadow"
              disabled={loading || attendance.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Users className="w-5 h-5 text-primary" />
              <span>Department Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold text-primary">{attendance.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/70" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {attendance.filter(record => 
                        record.status?.toLowerCase() === "present" && 
                        record.date === format(new Date(), "yyyy-MM-dd")
                      ).length}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-emerald-500"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Members</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Set(attendance.map(record => record.user_name)).size}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading department attendance data...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance List Component */}
      {!loading && (
        <LeaderAttendanceList data={attendance} />
      )}

      {/* Empty State */}
      {!loading && attendance.length === 0 && !error && (
        <Card className="shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">No Attendance Records</h3>
              <p className="text-muted-foreground max-w-md">
                There are no attendance records for your department yet. Records will appear here once members start marking their attendance.
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}