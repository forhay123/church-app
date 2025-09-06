import React, { useState, useMemo } from "react";
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
  UserX,
  Clock
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

/**
 * Renders a professional and sophisticated list of attendance records for department leaders.
 * @param {Array<Object>} data - Array of attendance records with user_name, date, and status.
 */
export default function LeaderAttendanceList({ data }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Calculate overall department statistics
  const departmentStats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRecords: 0, presentCount: 0, absentCount: 0, attendanceRate: 0, uniqueMembers: 0 };
    }

    const presentCount = data.filter(record => 
      record.status && record.status.toLowerCase() === "present"
    ).length;
    const absentCount = data.filter(record => 
      record.status && record.status.toLowerCase() === "absent"
    ).length;
    const totalRecords = presentCount + absentCount;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    const uniqueMembers = new Set(data.map(record => record.user_name)).size;

    return { totalRecords, presentCount, absentCount, attendanceRate, uniqueMembers };
  }, [data]);

  // Group attendance data by user and calculate attendance stats
  const userAttendanceStats = useMemo(() => {
    const stats = {};
    if (!data || data.length === 0) {
      return stats;
    }

    const uniqueUsers = Array.from(new Set(data.map(rec => rec.user_name))).sort();
    
    uniqueUsers.forEach(name => {
      const userRecords = data.filter(rec => rec.user_name === name);
      const presentCount = userRecords.filter(rec => 
        rec.status && rec.status.toLowerCase() === "present"
      ).length;
      const totalDays = userRecords.length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
      
      // Get latest attendance date
      const latestRecord = userRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      stats[name] = {
        totalDays,
        presentCount,
        attendancePercentage,
        records: userRecords,
        latestDate: latestRecord?.date,
        latestStatus: latestRecord?.status,
      };
    });
    return stats;
  }, [data]);

  // Sort and filter users
  const sortedAndFilteredUsers = useMemo(() => {
    let userNames = Object.keys(userAttendanceStats);
    
    // Apply sorting
    switch (sortBy) {
      case "attendance":
        userNames.sort((a, b) => 
          userAttendanceStats[b].attendancePercentage - userAttendanceStats[a].attendancePercentage
        );
        break;
      case "recent":
        userNames.sort((a, b) => {
          const dateA = userAttendanceStats[a].latestDate ? new Date(userAttendanceStats[a].latestDate) : new Date(0);
          const dateB = userAttendanceStats[b].latestDate ? new Date(userAttendanceStats[b].latestDate) : new Date(0);
          return dateB - dateA;
        });
        break;
      default: // name
        userNames.sort();
    }

    return userNames;
  }, [userAttendanceStats, sortBy]);

  // Get records for the selected date only
  const dailyAttendanceRecords = useMemo(() => {
    if (!selectedDate || !data) {
      return null;
    }
    const dateFormatted = format(selectedDate, "yyyy-MM-dd");
    
    const usersOnDate = Object.keys(userAttendanceStats).map(userName => {
      const record = data.find(rec => 
        rec.user_name === userName && 
        rec.date &&
        format(new Date(rec.date), "yyyy-MM-dd") === dateFormatted
      );
      
      return {
        user_name: userName,
        status: record?.status || "N/A",
        timestamp: record?.timestamp || null,
      };
    });
    
    // Apply status filter
    if (filterStatus === "all") {
      return usersOnDate;
    }
    return usersOnDate.filter(rec => 
      rec.status && rec.status.toLowerCase() === filterStatus
    );
  }, [data, selectedDate, userAttendanceStats, filterStatus]);

  // Handler to clear filters
  const handleClearFilters = () => {
    setSelectedDate(null);
    setFilterStatus("all");
    setSortBy("name");
  };

  const getAttendanceColorClass = (percentage) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-destructive";
  };

  const getAttendanceBadgeVariant = (percentage) => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    if (percentage >= 50) return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-8">
      {/* Department Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-3xl font-bold text-foreground">{departmentStats.uniqueMembers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-blue-600">{departmentStats.totalRecords}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-3xl font-bold text-emerald-600">{departmentStats.presentCount}</p>
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
                <p className="text-3xl font-bold text-destructive">{departmentStats.absentCount}</p>
              </div>
              <UserX className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dept. Rate</p>
                <p className="text-3xl font-bold text-orange-600">{departmentStats.attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters and Controls */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <span>Department Attendance Controls</span>
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
              <Label className="text-sm font-medium">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort Members By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="attendance">Attendance %</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
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
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Display */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>
              {selectedDate
                ? `Department Attendance - ${format(selectedDate, "PPP")}`
                : `Department Member Overview`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {selectedDate ? (
            // Daily view
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
                          {rec.user_name?.charAt(0).toUpperCase() || "N/A"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground text-lg">
                          {rec.user_name || "Unknown"}
                        </p>
                        {rec.timestamp && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(rec.timestamp), "HH:mm")}</span>
                          </div>
                        )}
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
                  No attendance records found for the selected date and filters.
                </p>
              </div>
            )
          ) : (
            // Overview mode
            sortedAndFilteredUsers.length > 0 ? (
              <div className="space-y-4">
                {sortedAndFilteredUsers.map((name) => {
                  const stats = userAttendanceStats[name];
                  const attendanceColorClass = getAttendanceColorClass(stats.attendancePercentage);
                  const badgeVariant = getAttendanceBadgeVariant(stats.attendancePercentage);
                  
                  return (
                    <div
                      key={name}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:from-accent/20 hover:to-accent/5 transition-all duration-300 shadow-sm hover:shadow-md space-y-4 lg:space-y-0"
                    >
                      <div className="flex-1 flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex-shrink-0 flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-primary">
                            {name?.charAt(0).toUpperCase() || "N/A"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground text-lg">{name}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{stats.presentCount} / {stats.totalDays} days present</span>
                            {stats.latestDate && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Last: {format(new Date(stats.latestDate), "MMM dd")}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={badgeVariant} className="text-xs">
                              {stats.latestStatus || "N/A"}
                            </Badge>
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
                            <span className={cn("font-bold text-lg", attendanceColorClass)}>
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
                <p className="text-lg font-medium text-muted-foreground mb-2">No Members Found</p>
                <p className="text-sm text-muted-foreground">
                  No department members found. Please check back later.
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}