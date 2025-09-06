import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { fetchDepartmentMembers, submitAttendance } from "@/utils/api";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CalendarDays, 
  Users, 
  UserCheck, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const DepartmentDutyMarkingPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const loadMembersWithAttendance = async () => {
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const data = await fetchDepartmentMembers(formattedDate);
        
        const prepared = data.map((m) => ({
          ...m,
          onDuty: m.on_duty ?? false,
          originalStatus: m.status,
          status: m.status,
          originalOnDuty: m.on_duty ?? false,
        }));
        setMembers(prepared);
      } catch (err) {
        console.error("Failed to load members with attendance:", err);
        toast({
          title: "Error",
          description: "Failed to load department members and attendance data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadMembersWithAttendance();
  }, [selectedDate, toast]);

  const handleUpdateStatus = (memberId, newStatus) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.user_id === memberId) {
          return {
            ...m,
            status: newStatus,
            onDuty: (newStatus === "PRESENT" || newStatus === "LATE") ? m.onDuty : false,
          };
        }
        return m;
      })
    );
  };

  const handleToggleOnDuty = (memberId) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.user_id === memberId && (m.status === "PRESENT" || m.status === "LATE")) {
          return { ...m, onDuty: !m.onDuty };
        }
        return m;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        records: members
          .filter(m => m.status !== m.originalStatus || m.onDuty !== (m.originalOnDuty ?? false))
          .map(m => ({
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
        description: `Successfully updated attendance for ${payload.records.length} department members.`,
      });
      
      setMembers(members.map(m => ({ 
        ...m, 
        originalStatus: m.status, 
        originalOnDuty: m.onDuty 
      })));
    } catch (err) {
      console.error("Failed to save attendance:", err);
      const errorDetail = err.response?.data?.detail || "Failed to save attendance. Please try again.";
      toast({
        title: "Error",
        description: errorDetail,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PRESENT":
        return "bg-success text-success-foreground hover:bg-success/90";
      case "ABSENT":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "LATE":
        return "bg-warning text-warning-foreground hover:bg-warning/90";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
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

  // Analytics data for charts
  const attendanceData = [
    { name: "Present", value: stats.present, color: "hsl(var(--success))" },
    { name: "Absent", value: stats.absent, color: "hsl(var(--destructive))" },
    { name: "Late", value: stats.late, color: "hsl(var(--warning))" }
  ].filter(item => item.value > 0);

  const dutyData = [
    { name: "On Duty", value: stats.onDuty, color: "hsl(var(--primary))" },
    { name: "Available", value: stats.present + stats.late - stats.onDuty, color: "hsl(var(--secondary))" }
  ].filter(item => item.value > 0);

  const departmentMetrics = [
    {
      name: "Attendance Rate",
      value: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0,
      trend: "+12%",
      color: "success"
    },
    {
      name: "Duty Coverage",
      value: stats.present + stats.late > 0 ? Math.round((stats.onDuty / (stats.present + stats.late)) * 100) : 0,
      trend: "+8%",
      color: "primary"
    },
    {
      name: "Punctuality",
      value: stats.present + stats.late > 0 ? Math.round((stats.present / (stats.present + stats.late)) * 100) : 0,
      trend: "+5%",
      color: "secondary"
    }
  ];

  const changedRecords = members.filter(
    (m) => m.status !== m.originalStatus || m.onDuty !== (m.originalOnDuty ?? false)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 md:p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Department Attendance & Duty
            </h1>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Track attendance and assign duties for your department members
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-4 md:space-y-6 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-lg md:text-2xl font-semibold flex items-center space-x-2 md:space-x-3">
                <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <span className="text-sm md:text-base lg:text-xl">
                  Attendance for {format(selectedDate, "MMM dd, yyyy")}
                </span>
              </CardTitle>
              {changedRecords > 0 && (
                <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1 w-fit">
                  {changedRecords} unsaved changes
                </Badge>
              )}
            </div>

            <Separator />

            {/* Date Selection */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-picker" className="text-sm font-medium flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Select Date</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full md:w-[280px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick Stats for Desktop */}
              {members.length > 0 && (
                <div className="hidden md:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span>{stats.present} Present</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <span>{stats.absent} Absent</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-warning rounded-full"></div>
                    <span>{stats.late} Late</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{stats.onDuty} On Duty</span>
                  </div>
                </div>
              )}
            </div>

            {/* Analytics Section */}
            {members.length > 0 && (
              <div className="space-y-4 md:space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {departmentMetrics.map((metric) => (
                    <Card key={metric.name} className="relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/20">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 md:space-y-2">
                            <p className="text-xs md:text-sm font-medium text-muted-foreground">{metric.name}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xl md:text-3xl font-bold text-foreground">{metric.value}%</span>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {metric.trend}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 md:p-3 rounded-full bg-primary/10">
                            <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Attendance Distribution */}
                  {attendanceData.length > 0 && (
                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20">
                      <CardHeader className="pb-3 md:pb-4">
                        <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                          <PieChart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                          <span>Attendance Distribution</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 md:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={attendanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {attendanceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Duty Assignment */}
                  {dutyData.length > 0 && (
                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20">
                      <CardHeader className="pb-3 md:pb-4">
                        <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                          <span>Duty Assignment</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 md:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dutyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                              <XAxis 
                                dataKey="name" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                              />
                              <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-3 md:p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                        <span className="text-lg md:text-2xl font-bold text-primary">{stats.total}</span>
                        <p className="text-xs text-primary/80">Total</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <CardContent className="p-3 md:p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-success" />
                        <span className="text-lg md:text-2xl font-bold text-success">{stats.present}</span>
                        <p className="text-xs text-success/80">Present</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
                    <CardContent className="p-3 md:p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                        <span className="text-lg md:text-2xl font-bold text-destructive">{stats.absent}</span>
                        <p className="text-xs text-destructive/80">Absent</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                    <CardContent className="p-3 md:p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-warning" />
                        <span className="text-lg md:text-2xl font-bold text-warning">{stats.late}</span>
                        <p className="text-xs text-warning/80">Late</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30">
                    <CardContent className="p-3 md:p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <Award className="w-3 h-3 md:w-4 md:h-4 text-secondary-foreground" />
                        <span className="text-lg md:text-2xl font-bold text-secondary-foreground">{stats.onDuty}</span>
                        <p className="text-xs text-secondary-foreground/80">On Duty</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 md:py-16 space-x-3">
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-primary" />
                <span className="text-sm md:text-lg text-muted-foreground">Loading department members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 md:py-16 space-y-4">
                <div className="p-3 md:p-4 bg-muted/20 rounded-full w-fit mx-auto">
                  <Users className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-muted-foreground">No Department Members</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    No members found in your department for the selected date.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Desktop Table Header */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4 px-6 py-4 bg-muted/30 rounded-lg font-semibold text-sm">
                  <span>Member Details</span>
                  <span className="text-center">Attendance Status</span>
                  <span className="text-center">On Duty Assignment</span>
                </div>

                {/* Members List - Responsive Design */}
                <div className="space-y-3 lg:space-y-1 px-3 lg:px-0">
                  {members.map((member, index) => (
                    <div key={member.user_id}>
                      {/* Desktop Layout */}
                      <div
                        className={`hidden lg:grid lg:grid-cols-3 gap-4 px-6 py-5 hover:bg-muted/20 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        } ${member.status !== member.originalStatus || member.onDuty !== member.originalOnDuty ? 'border-l-4 border-l-primary' : ''}`}
                      >
                        {/* Member Details */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                              {member.user_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-lg">{member.user_name}</p>
                            <p className="text-sm text-muted-foreground">Member ID: {member.user_id}</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center">
                          {member.status ? (
                            <Badge className={`${getStatusColor(member.status)} flex items-center space-x-2 px-4 py-2 text-sm`}>
                              {getStatusIcon(member.status)}
                              <span className="font-medium">{member.status}</span>
                            </Badge>
                          ) : (
                            <RadioGroup
                              onValueChange={(value) => handleUpdateStatus(member.user_id, value)}
                              className="flex justify-center space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PRESENT" id={`present-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`present-${member.user_id}`} className="text-sm cursor-pointer font-medium">Present</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ABSENT" id={`absent-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`absent-${member.user_id}`} className="text-sm cursor-pointer font-medium">Absent</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="LATE" id={`late-${member.user_id}`} className="w-4 h-4" />
                                <label htmlFor={`late-${member.user_id}`} className="text-sm cursor-pointer font-medium">Late</label>
                              </div>
                            </RadioGroup>
                          )}
                        </div>

                        {/* On Duty Toggle */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={member.onDuty}
                              onCheckedChange={() => handleToggleOnDuty(member.user_id)}
                              disabled={!member.status || (member.status !== "PRESENT" && member.status !== "LATE")}
                              className="w-5 h-5"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${member.onDuty ? 'text-primary' : 'text-muted-foreground'}`}>
                                {member.onDuty ? 'On Duty' : 'Available'}
                              </span>
                              {(!member.status || (member.status !== "PRESENT" && member.status !== "LATE")) && (
                                <span className="text-xs text-muted-foreground">Mark present first</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <Card className={`lg:hidden ${member.status !== member.originalStatus || member.onDuty !== member.originalOnDuty ? 'border-l-4 border-l-primary' : ''}`}>
                        <CardContent className="p-4">
                          {/* Member Info */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {member.user_name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{member.user_name}</p>
                              <p className="text-xs text-muted-foreground">ID: {member.user_id}</p>
                            </div>
                          </div>

                          {/* Status Section */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Attendance Status</p>
                              {member.status ? (
                                <Badge className={`${getStatusColor(member.status)} flex items-center space-x-2 px-3 py-1 w-fit text-xs`}>
                                  {getStatusIcon(member.status)}
                                  <span className="font-medium">{member.status}</span>
                                </Badge>
                              ) : (
                                <RadioGroup
                                  onValueChange={(value) => handleUpdateStatus(member.user_id, value)}
                                  className="grid grid-cols-3 gap-2"
                                >
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="PRESENT" id={`present-mobile-${member.user_id}`} className="w-4 h-4" />
                                    <label htmlFor={`present-mobile-${member.user_id}`} className="text-xs cursor-pointer">Present</label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="ABSENT" id={`absent-mobile-${member.user_id}`} className="w-4 h-4" />
                                    <label htmlFor={`absent-mobile-${member.user_id}`} className="text-xs cursor-pointer">Absent</label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="LATE" id={`late-mobile-${member.user_id}`} className="w-4 h-4" />
                                    <label htmlFor={`late-mobile-${member.user_id}`} className="text-xs cursor-pointer">Late</label>
                                  </div>
                                </RadioGroup>
                              )}
                            </div>

                            {/* Duty Assignment */}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Duty Assignment</p>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={member.onDuty}
                                  onCheckedChange={() => handleToggleOnDuty(member.user_id)}
                                  disabled={!member.status || (member.status !== "PRESENT" && member.status !== "LATE")}
                                  className="w-4 h-4"
                                />
                                <div className="flex flex-col">
                                  <span className={`text-sm font-medium ${member.onDuty ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {member.onDuty ? 'On Duty' : 'Available'}
                                  </span>
                                  {(!member.status || (member.status !== "PRESENT" && member.status !== "LATE")) && (
                                    <span className="text-xs text-muted-foreground">Mark present first</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {members.length > 0 && (
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              <Button 
                onClick={handleSave} 
                disabled={saving || changedRecords === 0}
                className="w-full h-10 md:h-12 text-sm md:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    <span>Saving Department Attendance...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Save Department Changes ({changedRecords})</span>
                  </div>
                )}
              </Button>
              {changedRecords === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  No changes to save. Update attendance status or duty assignments to enable saving.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DepartmentDutyMarkingPage;