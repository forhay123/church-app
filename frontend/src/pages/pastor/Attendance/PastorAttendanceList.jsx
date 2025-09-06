import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { 
  Filter, 
  CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  X, 
  Users, 
  TrendingUp, 
  BarChart3,
  UserCheck,
  UserX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Progress from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchDepartmentsNames } from "@/utils/api";

export default function PastorAttendanceList({ data }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Fetch departments automatically using the same pattern as AdminUsers
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const departmentsData = await fetchDepartmentsNames();
        // Handle response the same way as AdminUsers.jsx
        const deptArray = departmentsData?.data || departmentsData || [];
        setDepartments(deptArray);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepartments();
  }, []);

  // Build lookup map for department_id → department name (same as AdminUsers)
  const departmentNameMap = useMemo(() => {
    return departments.filter(d => d && d.id).reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {});
  }, [departments]);

  // Get unique department names for dropdown (prevent duplicates)
  const uniqueDepartmentNames = useMemo(() => {
    const names = new Set();
    return departments.filter(d => d && d.id && d.name).filter(dept => {
      if (names.has(dept.name)) {
        return false;
      }
      names.add(dept.name);
      return true;
    });
  }, [departments]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRecords: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 };
    }

    const presentCount = data.filter(record => 
      record.status && record.status.toLowerCase() === "present"
    ).length;
    const absentCount = data.filter(record => 
      record.status && record.status.toLowerCase() === "absent"
    ).length;
    const totalRecords = presentCount + absentCount;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return { totalRecords, presentCount, absentCount, attendanceRate };
  }, [data]);

  // Group attendance stats by user
  const userAttendanceStats = useMemo(() => {
    const stats = {};
    if (!data || data.length === 0) return stats;

    const uniqueUsers = Array.from(new Set(data.map((rec) => rec.user_name))).sort();

    uniqueUsers.forEach((name) => {
      const userRecords = data.filter((rec) => rec.user_name === name);
      const presentCount = userRecords.filter(
        (rec) => rec.status && rec.status.toLowerCase() === "present"
      ).length;
      const totalDays = userRecords.length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      // Get department info from any record for this user
      const sampleRecord = userRecords[0];
      const departmentName = sampleRecord?.department_id && departmentNameMap[sampleRecord.department_id] 
        ? departmentNameMap[sampleRecord.department_id] 
        : "Unassigned";

      stats[name] = {
        totalDays,
        presentCount,
        attendancePercentage,
        departmentName,
        departmentId: sampleRecord?.department_id,
        records: userRecords,
      };
    });
    return stats;
  }, [data, departmentNameMap]);

  // Filter users based on department and status
  const filteredUserStats = useMemo(() => {
    let filtered = { ...userAttendanceStats };

    // Filter by department (now filtering by department name)
    if (filterDepartment !== "all") {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, stats]) => 
          stats.departmentName === filterDepartment
        )
      );
    }

    return filtered;
  }, [userAttendanceStats, filterDepartment]);

  // Daily attendance for selected date
  const dailyAttendanceRecords = useMemo(() => {
    if (!selectedDate || !data) return null;
    const dateFormatted = format(selectedDate, "yyyy-MM-dd");

    const usersOnDate = Object.keys(filteredUserStats).map((userName) => {
      const record = data.find(
        (rec) =>
          rec.user_name === userName &&
          rec.date &&
          format(new Date(rec.date), "yyyy-MM-dd") === dateFormatted
      );
      
      const userStats = filteredUserStats[userName];
      
      return {
        user_name: userName,
        status: record?.status || "N/A",
        department_name: userStats.departmentName,
        department_id: userStats.departmentId,
      };
    });

    // Filter by status
    if (filterStatus === "all") return usersOnDate;
    return usersOnDate.filter(
      (rec) => rec.status && rec.status.toLowerCase() === filterStatus
    );
  }, [data, selectedDate, filteredUserStats, filterStatus]);

  const handleClearFilters = () => {
    setSelectedDate(null);
    setFilterStatus("all");
    setFilterDepartment("all");
  };

  if (loadingDepartments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-foreground">{overallStats.totalRecords}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-3xl font-bold text-emerald-600">{overallStats.presentCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-3xl font-bold text-destructive">{overallStats.absentCount}</p>
              </div>
              <UserX className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-600">{overallStats.attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <span>Advanced Filters & Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Date</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartmentNames.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Actions</Label>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>
              {selectedDate
                ? `Attendance for ${format(selectedDate, "PPP")}`
                : `Member Attendance Overview`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {selectedDate ? (
            dailyAttendanceRecords && dailyAttendanceRecords.length > 0 ? (
              <div className="space-y-4">
                {dailyAttendanceRecords.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-5 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:from-accent/20 hover:to-accent/5 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-primary">
                          {rec.user_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground text-lg">
                          {rec.user_name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {rec.department_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      {rec.status && rec.status.toLowerCase() === "present" ? (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Present
                        </Badge>
                      ) : rec.status && rec.status.toLowerCase() === "absent" ? (
                        <Badge className="bg-destructive text-white hover:bg-destructive/90 shadow-sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Absent
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shadow-sm">N/A</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">No Records Found</p>
                <p className="text-sm text-muted-foreground">
                  No attendance records match your current filters.
                </p>
              </div>
            )
          ) : Object.keys(filteredUserStats).length > 0 ? (
            <div className="space-y-4">
              {Object.keys(filteredUserStats).map((name) => {
                const stats = filteredUserStats[name];
                return (
                  <div
                    key={name}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:from-accent/20 hover:to-accent/5 transition-all duration-300 shadow-sm hover:shadow-md space-y-4 lg:space-y-0"
                  >
                    <div className="flex-1 flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-primary">
                          {name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground text-lg">{name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {stats.departmentName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {stats.presentCount} / {stats.totalDays} days present
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 lg:max-w-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <Progress 
                            value={stats.attendancePercentage} 
                            className="h-3 bg-muted" 
                          />
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-foreground">
                            {stats.attendancePercentage}%
                          </span>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">No Data Available</p>
              <p className="text-sm text-muted-foreground">
                No attendance records found for the selected filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}