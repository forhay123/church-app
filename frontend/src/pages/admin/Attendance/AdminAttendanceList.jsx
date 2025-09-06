import React, { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Filter, Search, Users, CheckCircle2, XCircle, Loader2, Download, RefreshCw, BarChart3 } from "lucide-react";
import {
  fetchUsers,
  fetchAttendanceByDate,
  submitAttendance,
  fetchChurches,
  fetchDepartmentsNames,
  fetchRoles,
} from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  AttendanceStatusChart, 
  AttendanceRateChart, 
  DepartmentAttendanceChart, 
  WeeklyTrendChart
} from "@/components/charts/AttendanceCharts";

export default function AdminAttendanceList() {
  // Master state for all users and attendance records
  const [allUsers, setAllUsers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({
    church: "all",
    department: "all",
    name: "",
    status: "all",
    role: "all",
  });

  // Dynamic filter options fetched from the API
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Combines all data fetching into a single effect to avoid race conditions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch filter options concurrently
        const [churchesData, departmentsData, rolesData] = await Promise.all([
          fetchChurches(),
          fetchDepartmentsNames(),
          fetchRoles(),
        ]);
        
        setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
        
        // Deduplicate department names before setting the state
        const allDepartments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
        const uniqueDepartments = [];
        const departmentNames = new Set();
        
        allDepartments.forEach((dept) => {
          if (dept && dept.name && !departmentNames.has(dept.name)) {
            departmentNames.add(dept.name);
            uniqueDepartments.push(dept);
          }
        });

        setDepartments(uniqueDepartments);
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);

        // Fetch all users
        const usersData = await fetchUsers();
        const users = Array.isArray(usersData) ? usersData : usersData?.data || [];
        setAllUsers(users);

        // Initialize and fetch attendance for the selected date
        const initialAttendance = {};
        users.forEach((user) => {
          initialAttendance[user.id] = "absent";
        });
        
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const attendanceData = await fetchAttendanceByDate(dateStr);
        
        if (Array.isArray(attendanceData) && attendanceData.length) {
          const updatedAttendance = { ...initialAttendance };
          attendanceData.forEach((record) => {
            updatedAttendance[record.user_id] = record.status.toLowerCase();
          });
          setAttendance(updatedAttendance);
        } else {
          setAttendance(initialAttendance);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        const errorMessage = error.response?.data?.detail || error.message || "Failed to load data. Please try again.";
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

    fetchData();
  }, [selectedDate, toast]);

  // Create department name lookup map
  const departmentMap = useMemo(() => {
    const map = {};
    departments.forEach((dept) => {
      if (dept && dept.id) {
        map[dept.id] = dept.name;
      }
    });
    return map;
  }, [departments]);

  // Filters the users based on the current filter state using memoization
  const filteredUsers = useMemo(() => {
    let tempUsers = [...allUsers];

    if (filters.name) {
      tempUsers = tempUsers.filter((user) =>
        user.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.church !== "all") {
      tempUsers = tempUsers.filter(
        (user) => user.church_id === parseInt(filters.church)
      );
    }
    if (filters.department !== "all") {
      const selectedDepartment = departments.find(d => d.id === parseInt(filters.department));
      if (selectedDepartment) {
        tempUsers = tempUsers.filter(
          (user) => 
            user.department_id === parseInt(filters.department) || 
            (user.department_name && user.department_name.toLowerCase() === selectedDepartment.name.toLowerCase())
        );
      }
    }
    if (filters.role !== "all") {
      tempUsers = tempUsers.filter(
        (user) => user.role?.toLowerCase() === filters.role.toLowerCase()
      );
    }
    if (filters.status !== "all") {
      tempUsers = tempUsers.filter(
        (user) => attendance[user.id] === filters.status
      );
    }

    return tempUsers;
  }, [allUsers, attendance, filters, departments]);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  }, []);

  const handleMark = useCallback((userId, status) => {
    setAttendance((prev) => ({ ...prev, [userId]: status }));
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleExportCSV = useCallback(() => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Name", "Email", "Role", "Department", "Church", "Status", "Date"];
      const csvContent = [
        headers.join(","),
        ...filteredUsers.map(user => [
          `"${user.name || ""}"`,
          `"${user.email || ""}"`,
          `"${user.role || ""}"`,
          `"${departmentMap[user.department_id] || user.department_name || ""}"`,
          `"${user.church_name || ""}"`,
          `"${attendance[user.id] || "absent"}"`,
          format(selectedDate, "yyyy-MM-dd")
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${format(selectedDate, "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Attendance data has been exported to CSV file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data.",
        variant: "destructive",
      });
    }
  }, [filteredUsers, attendance, selectedDate, departmentMap, toast]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const attendanceData = allUsers.map((user) => ({
        user_id: user.id,
        status: attendance[user.id]?.toUpperCase() || "ABSENT",
      }));

      const payload = {
        date: format(selectedDate, "yyyy-MM-dd"),
        records: attendanceData,
      };

      await submitAttendance(payload);
      toast({
        title: "Success",
        description: `Attendance for ${payload.date} submitted successfully`,
      });
    } catch (err) {
      console.error("Error submitting attendance:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to submit attendance. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const presentCount = Object.values(attendance).filter(status => status === "present").length;
    const absentCount = Object.values(attendance).filter(status => status === "absent").length;
    const totalCount = Object.keys(attendance).length;
    
    return {
      total: totalCount,
      present: presentCount,
      absent: absentCount,
      late: 0, // Not used in this component
      onDuty: 0 // Not used in this component
    };
  }, [attendance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">Loading attendance management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Track and manage attendance for all church members
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              onClick={handleExportCSV} 
              variant="outline"
              size="sm"
              disabled={loading || filteredUsers.length === 0}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stats.total}</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary/70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-2xl md:text-3xl font-bold text-success">{stats.present}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-primary"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics Section */}
        {stats.total > 0 && (
          <>
            <Separator className="my-8" />
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xl font-semibold text-card-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Visual Analytics</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AttendanceStatusChart stats={stats} />
                </div>
                <div className="lg:col-span-1">
                  <AttendanceRateChart stats={stats} />
                </div>
                <div className="lg:col-span-1 xl:col-span-1">
                  <WeeklyTrendChart currentStats={stats} />
                </div>
                
                <div className="lg:col-span-2 xl:col-span-3">
                  <DepartmentAttendanceChart 
                    members={allUsers.map(user => ({
                      ...user,
                      status: attendance[user.id]?.toUpperCase() || "ABSENT"
                    }))} 
                    departments={departments} 
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <Filter className="w-5 h-5 text-primary" />
            <span>Attendance Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal shadow-sm")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Search by Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="pl-10 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filter by Church</Label>
              <Select
                value={filters.church}
                onValueChange={(value) => handleFilterChange("church", value)}
              >
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="All Churches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id.toString()}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) => handleFilterChange("department", value)}
              >
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange("role", value)}
              >
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role.toLowerCase()}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Users className="w-5 h-5 text-primary" />
              <span>Members ({filteredUsers.length})</span>
            </CardTitle>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || stats.total === 0}
              size="sm"
              className="shadow-sm hover:shadow-md transition-shadow w-full md:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Attendance"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors shadow-sm space-y-3 md:space-y-0"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {user.role || "No role"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {departmentMap[user.department_id] || user.department_name || "No department"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <Button
                      variant={attendance[user.id] === "present" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMark(user.id, "present")}
                      className={cn(
                        "shadow-sm transition-all flex-1 md:flex-none",
                        attendance[user.id] === "present" && "bg-success hover:bg-success/80 text-success-foreground"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      variant={attendance[user.id] === "absent" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleMark(user.id, "absent")}
                      className="shadow-sm transition-all flex-1 md:flex-none"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p>No members match your current filter criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}