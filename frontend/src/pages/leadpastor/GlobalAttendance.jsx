import React, { useEffect, useState, useMemo } from "react";
import {
  fetchUsers,
  fetchAttendanceByDate,
  fetchChurches,
  fetchDepartmentsNames
} from "../../utils/api";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Building2, 
  Calendar,
  Filter,
  TrendingUp,
  BarChart3
} from "lucide-react";

export default function GlobalAttendance() {
  const [allUsers, setAllUsers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    name: "",
    church: "all",
    department: "all",
    status: "all",
    onDuty: "all",
  });

  // Load all necessary data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        
        const [usersData, churchesData, departmentsData] = await Promise.all([
          fetchUsers(),
          fetchChurches(),
          fetchDepartmentsNames(),
        ]);

        const users = Array.isArray(usersData) ? usersData : usersData?.data || [];
        setAllUsers(users);
        setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);

        const initialAttendance = {};
        users.forEach((user) => {
          initialAttendance[user.id] = { status: "Absent", onDuty: false };
        });
        
        const attendanceData = await fetchAttendanceByDate(filters.date);
        
        if (Array.isArray(attendanceData) && attendanceData.length) {
          const updatedAttendance = { ...initialAttendance };
          attendanceData.forEach((record) => {
            updatedAttendance[record.user_id] = {
              status: record.status || "Absent",
              onDuty: record.on_duty
            };
          });
          setAttendance(updatedAttendance);
        } else {
          setAttendance(initialAttendance);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters.date]);

  // Enhanced filtering with memoization
  const filteredUsers = useMemo(() => {
    let tempUsers = [...allUsers];

    if (filters.name) {
      tempUsers = tempUsers.filter((user) =>
        user.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    
    if (filters.church && filters.church !== "all") {
      tempUsers = tempUsers.filter((user) => user.church_id?.toString() === filters.church);
    }
    
    if (filters.department && filters.department !== "all") {
      tempUsers = tempUsers.filter((user) => user.department_id?.toString() === filters.department);
    }

    if (filters.status && filters.status !== "all") {
      tempUsers = tempUsers.filter((user) =>
        (attendance[user.id]?.status?.toLowerCase() || "absent") === filters.status.toLowerCase()
      );
    }

    if (filters.onDuty && filters.onDuty !== "all") {
      tempUsers = tempUsers.filter((user) =>
        (attendance[user.id]?.onDuty?.toString() === filters.onDuty)
      );
    }

    return tempUsers;
  }, [allUsers, attendance, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const presentUsers = filteredUsers.filter(user => 
      attendance[user.id]?.status?.toLowerCase() === "present"
    ).length;
    const absentUsers = filteredUsers.filter(user => 
      attendance[user.id]?.status?.toLowerCase() === "absent"
    ).length;
    const onDutyUsers = filteredUsers.filter(user => 
      attendance[user.id]?.onDuty === true
    ).length;

    return {
      total: totalUsers,
      present: presentUsers,
      absent: absentUsers,
      onDuty: onDutyUsers,
      attendanceRate: totalUsers > 0 ? Math.round((presentUsers / totalUsers) * 100) : 0
    };
  }, [filteredUsers, attendance]);

  // Helper functions
  const getChurchName = (id) => churches.find((c) => c.id === id)?.name || "—";
  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg border-destructive/20">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            Global Attendance Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive attendance tracking and analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-3xl font-bold text-success">{stats.present}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <UserCheck className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-destructive/5 to-destructive/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                  <p className="text-3xl font-bold text-destructive">{stats.absent}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <UserX className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Duty</p>
                  <p className="text-3xl font-bold text-warning">{stats.onDuty}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Rate Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Attendance Rate</h3>
                  <p className="text-sm text-muted-foreground">Overall attendance percentage</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{stats.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">of total members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="h-11 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Search by name..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="h-11 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Church</Label>
                <Select value={filters.church} onValueChange={(value) => setFilters({ ...filters, church: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All Churches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
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
                <Label className="text-sm font-medium">On Duty</Label>
                <Select value={filters.onDuty} onValueChange={(value) => setFilters({ ...filters, onDuty: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        {filteredUsers.length > 0 ? (
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Attendance Records
                </div>
                <Badge variant="secondary" className="text-sm">
                  {filteredUsers.length} members
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Church</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-center">On Duty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const record = attendance[user.id] || { status: "Absent", onDuty: false };
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{getChurchName(user.church_id)}</TableCell>
                          <TableCell className="text-muted-foreground">{getDepartmentName(user.department_id)}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={record.status?.toLowerCase() === "present" ? "default" : "secondary"}
                              className={record.status?.toLowerCase() === "present" 
                                ? "bg-success text-success-foreground" 
                                : "bg-destructive/10 text-destructive border-destructive/20"
                              }
                            >
                              {record.status?.toLowerCase() === "present" ? (
                                <><UserCheck className="w-3 h-3 mr-1" />Present</>
                              ) : (
                                <><UserX className="w-3 h-3 mr-1" />Absent</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={record.onDuty ? "default" : "secondary"}
                              className={record.onDuty 
                                ? "bg-warning text-warning-foreground" 
                                : "bg-muted text-muted-foreground"
                              }
                            >
                              {record.onDuty ? (
                                <><Clock className="w-3 h-3 mr-1" />On Duty</>
                              ) : (
                                <>Available</>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                <p className="text-muted-foreground">No members found matching the selected filters.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}