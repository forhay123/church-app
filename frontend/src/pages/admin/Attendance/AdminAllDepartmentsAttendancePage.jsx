import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDepartments,
  fetchChurches,
  fetchAdminAllDepartmentsAttendance,
  submitAttendance,
} from "@/utils/api";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarDays, 
  Users, 
  Building2, 
  BookOpen, 
  UserCheck, 
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  AttendanceStatusChart, 
  AttendanceRateChart, 
  DepartmentAttendanceChart, 
  OnDutyChart,
  WeeklyTrendChart
} from "@/components/charts/AttendanceCharts";

const AdminAllDepartmentsAttendance = () => {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [churches, setChurches] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedChurch, setSelectedChurch] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  // Load departments & churches
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [deptData, churchData] = await Promise.all([
          fetchDepartments(),
          fetchChurches(),
        ]);
        setDepartments(
          Array.isArray(deptData)
            ? deptData.filter((d) => d && d.id != null)
            : []
        );
        setChurches(
          Array.isArray(churchData)
            ? churchData.filter((c) => c && c.id != null)
            : []
        );
      } catch (err) {
        console.error("Failed to load filters:", err);
        toast({
          title: "Error",
          description: "Failed to load filter options. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    loadFilters();
  }, []);

  // Load members based on date, department, church
  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const departmentId = selectedDepartment === "all" ? null : selectedDepartment;
        const churchId = selectedChurch === "all" ? null : selectedChurch;

        const data = await fetchAdminAllDepartmentsAttendance(
          formattedDate,
          departmentId,
          churchId
        );

        const prepared = data.map((m) => ({
          ...m,
          onDuty: m.on_duty ?? false,
          originalStatus: m.status,
          status: m.status,
          originalOnDuty: m.on_duty ?? false,
        }));
        setMembers(prepared);
      } catch (err) {
        console.error("Failed to load attendance:", err);
        toast({
          title: "Error",
          description: "Failed to load attendance data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [selectedDate, selectedDepartment, selectedChurch, toast]);

  const handleUpdateStatus = (memberId, newStatus) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === memberId
          ? {
              ...m,
              status: newStatus,
              onDuty:
                newStatus === "PRESENT" || newStatus === "LATE"
                  ? m.onDuty
                  : false,
            }
          : m
      )
    );
  };

  const handleToggleOnDuty = (memberId) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === memberId &&
        (m.status === "PRESENT" || m.status === "LATE")
          ? { ...m, onDuty: !m.onDuty }
          : m
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date: format(selectedDate, "yyyy-MM-dd"),
        records: members
          .filter(
            (m) =>
              m.status !== m.originalStatus ||
              m.onDuty !== (m.originalOnDuty ?? false)
          )
          .map((m) => ({
            user_id: m.user_id,
            status: m.status,
            on_duty: m.onDuty,
          })),
      };
      
      if (payload.records.length === 0) {
        toast({
          title: "No Changes",
          description: "No attendance changes to save.",
        });
        return;
      }

      await submitAttendance(payload);
      toast({
        title: "Success",
        description: `Successfully updated attendance for ${payload.records.length} members.`,
      });
      setMembers(
        members.map((m) => ({
          ...m,
          originalStatus: m.status,
          originalOnDuty: m.onDuty,
        }))
      );
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Name", "User ID", "Department", "Status", "On Duty", "Date"];
      const csvContent = [
        headers.join(","),
        ...members.map(member => [
          `"${member.user_name || ""}"`,
          member.user_id,
          `"${departments.find(d => d.id === member.department_id)?.name || ""}"`,
          member.status || "ABSENT",
          member.onDuty ? "Yes" : "No",
          format(selectedDate, "yyyy-MM-dd")
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `department-attendance-${format(selectedDate, "yyyy-MM-dd")}.csv`;
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
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PRESENT":
        return "bg-success hover:bg-success/80 text-success-foreground";
      case "ABSENT":
        return "bg-error hover:bg-error/80 text-error-foreground";
      case "LATE":
        return "bg-warning hover:bg-warning/80 text-warning-foreground";
      default:
        return "bg-muted hover:bg-muted/80 text-muted-foreground";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="w-3 h-3" />;
      case "ABSENT":
        return <XCircle className="w-3 h-3" />;
      case "LATE":
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const stats = {
    total: members.length,
    present: members.filter(m => m.status === "PRESENT").length,
    absent: members.filter(m => m.status === "ABSENT").length,
    late: members.filter(m => m.status === "LATE").length,
    onDuty: members.filter(m => m.onDuty).length,
  };

  const changedRecords = members.filter(
    (m) =>
      m.status !== m.originalStatus ||
      m.onDuty !== (m.originalOnDuty ?? false)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Department Attendance
                </h1>
                <p className="text-base md:text-lg text-muted-foreground">
                  Comprehensive attendance tracking across departments
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={members.length === 0}
                className="shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-xl md:text-2xl font-semibold flex items-center space-x-3">
                <CalendarDays className="w-6 h-6 text-primary" />
                <span>Attendance for {format(selectedDate, "EEEE, MMMM do, yyyy")}</span>
              </CardTitle>
              {changedRecords > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
                  {changedRecords} unsaved changes
                </Badge>
              )}
            </div>

            <Separator />

            {/* Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filter Options</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label htmlFor="date-picker" className="text-sm font-medium flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>Select Date</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal")}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP")}
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

                {/* Church Selector */}
                <div className="space-y-2">
                  <Label htmlFor="church-select" className="text-sm font-medium flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Church</span>
                  </Label>
                  <Select onValueChange={setSelectedChurch} value={selectedChurch}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Church" />
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

                {/* Department Selector */}
                <div className="space-y-2">
                  <Label htmlFor="department-select" className="text-sm font-medium flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Department</span>
                  </Label>
                  <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Department" />
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
              </div>
            </div>

            {/* Statistics Cards */}
            {members.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="dashboard-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xl md:text-2xl font-bold text-primary">{stats.total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                  </CardContent>
                </Card>

                <Card className="dashboard-card bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-xl md:text-2xl font-bold text-success">{stats.present}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Present</p>
                  </CardContent>
                </Card>

                <Card className="dashboard-card bg-gradient-to-br from-error/10 to-error/5 border-error/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <XCircle className="w-4 h-4 text-error" />
                      <span className="text-xl md:text-2xl font-bold text-error">{stats.absent}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Absent</p>
                  </CardContent>
                </Card>

                <Card className="dashboard-card bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <span className="text-xl md:text-2xl font-bold text-warning">{stats.late}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Late</p>
                  </CardContent>
                </Card>

                <Card className="dashboard-card bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <UserCheck className="w-4 h-4 text-secondary" />
                      <span className="text-xl md:text-2xl font-bold text-secondary">{stats.onDuty}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">On Duty</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Visual Analytics Section */}
            {members.length > 0 && (
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
                      <OnDutyChart stats={stats} />
                    </div>
                    
                    <div className="lg:col-span-2 xl:col-span-2">
                      <DepartmentAttendanceChart members={members} departments={departments} />
                    </div>
                    
                    <div className="lg:col-span-1 xl:col-span-1">
                      <WeeklyTrendChart currentStats={stats} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardHeader>

          <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-lg text-muted-foreground">Loading attendance data...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground">No Members Found</h3>
                  <p className="text-sm text-muted-foreground">
                    No members found for the selected filters. Try adjusting your filter criteria.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Mobile View */}
                <div className="md:hidden space-y-3 px-4">
                  {members.map((member, index) => (
                    <Card
                      key={member.user_id}
                      className={`p-4 hover:shadow-md transition-shadow ${
                        member.status !== member.originalStatus || member.onDuty !== member.originalOnDuty ? 'border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Member Info */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {member.user_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{member.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {departments.find(d => d.id === member.department_id)?.name || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Status</Label>
                          {member.status ? (
                            <Badge className={`${getStatusColor(member.status)} flex items-center space-x-1 px-3 py-1 w-fit`}>
                              {getStatusIcon(member.status)}
                              <span className="text-xs font-medium">{member.status}</span>
                            </Badge>
                          ) : (
                            <RadioGroup
                              onValueChange={(value) => handleUpdateStatus(member.user_id, value)}
                              className="flex flex-wrap gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PRESENT" id={`present-${member.user_id}`} />
                                <Label htmlFor={`present-${member.user_id}`} className="text-sm cursor-pointer">Present</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ABSENT" id={`absent-${member.user_id}`} />
                                <Label htmlFor={`absent-${member.user_id}`} className="text-sm cursor-pointer">Absent</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="LATE" id={`late-${member.user_id}`} />
                                <Label htmlFor={`late-${member.user_id}`} className="text-sm cursor-pointer">Late</Label>
                              </div>
                            </RadioGroup>
                          )}
                        </div>

                        {/* On Duty Toggle */}
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">On Duty</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={member.onDuty}
                              onCheckedChange={() => handleToggleOnDuty(member.user_id)}
                              disabled={!member.status || (member.status !== "PRESENT" && member.status !== "LATE")}
                            />
                            <span className={`text-xs ${member.onDuty ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {member.onDuty ? 'On Duty' : 'Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-muted/30 rounded-lg font-semibold text-sm">
                    <span>Member Details</span>
                    <span className="text-center">Attendance Status</span>
                    <span className="text-center">Department</span>
                    <span className="text-center">On Duty</span>
                  </div>

                  {/* Members List */}
                  <div className="space-y-1">
                    {members.map((member, index) => (
                      <div
                        key={member.user_id}
                        className={`grid grid-cols-4 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        } ${member.status !== member.originalStatus || member.onDuty !== member.originalOnDuty ? 'border-l-4 border-l-primary' : ''}`}
                      >
                        {/* Member Details */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {member.user_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.user_name}</p>
                            <p className="text-xs text-muted-foreground">ID: {member.user_id}</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center">
                          {member.status ? (
                            <Badge className={`${getStatusColor(member.status)} flex items-center space-x-1 px-3 py-1`}>
                              {getStatusIcon(member.status)}
                              <span className="text-xs font-medium">{member.status}</span>
                            </Badge>
                          ) : (
                            <RadioGroup
                              onValueChange={(value) => handleUpdateStatus(member.user_id, value)}
                              className="flex justify-center space-x-4"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="PRESENT" id={`present-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`present-${member.user_id}`} className="text-xs cursor-pointer">Present</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="ABSENT" id={`absent-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`absent-${member.user_id}`} className="text-xs cursor-pointer">Absent</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="LATE" id={`late-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`late-${member.user_id}`} className="text-xs cursor-pointer">Late</label>
                              </div>
                            </RadioGroup>
                          )}
                        </div>

                        {/* Department */}
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            {member.department_id && departments.find(d => d.id === member.department_id)?.name || "N/A"}
                          </span>
                        </div>

                        {/* On Duty Toggle */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={member.onDuty}
                              onCheckedChange={() => handleToggleOnDuty(member.user_id)}
                              disabled={!member.status || (member.status !== "PRESENT" && member.status !== "LATE")}
                              className="w-5 h-5"
                            />
                            <span className={`text-xs ${member.onDuty ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {member.onDuty ? 'On Duty' : 'Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {members.length > 0 && (
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <Button 
                onClick={handleSave} 
                disabled={saving || changedRecords === 0}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Save Changes ({changedRecords})</span>
                  </div>
                )}
              </Button>
              {changedRecords === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  No changes to save. Make attendance updates to enable saving.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminAllDepartmentsAttendance;