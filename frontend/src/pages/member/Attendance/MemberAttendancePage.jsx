import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Filter, TrendingUp, BarChart3, PieChart, Calendar as CalendarIconAlt } from "lucide-react";
import MemberAttendanceView from "../../../components/MemberAttendanceView";
import { fetchMemberAttendance } from "@utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

export default function MemberAttendancePage() {
  const [allAttendance, setAllAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Load all attendance for the logged-in user
  useEffect(() => {
    const loadAllAttendance = async () => {
      setLoading(true);
      try {
        const data = await fetchMemberAttendance();
        setAllAttendance(data);
        setFilteredAttendance(data);
      } catch (err) {
        console.error("❌ Error loading attendance:", err);
        setAllAttendance([]);
        setFilteredAttendance([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllAttendance();
  }, []);

  // Filter by date
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setFilteredAttendance(allAttendance.filter((rec) => rec.date === dateStr));
    } else {
      setFilteredAttendance(allAttendance);
    }
  }, [selectedDate, allAttendance]);

  // Analytics calculations
  const attendanceStats = {
    total: allAttendance.length,
    present: allAttendance.filter(record => record.status === "PRESENT").length,
    absent: allAttendance.filter(record => record.status === "ABSENT").length,
    late: allAttendance.filter(record => record.status === "LATE").length,
    onDuty: allAttendance.filter(record => record.on_duty).length,
  };

  const attendanceRate = attendanceStats.total > 0 ? 
    Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100) : 0;

  const punctualityRate = (attendanceStats.present + attendanceStats.late) > 0 ?
    Math.round((attendanceStats.present / (attendanceStats.present + attendanceStats.late)) * 100) : 0;

  // Chart data
  const pieData = [
    { name: "Present", value: attendanceStats.present, color: "hsl(var(--success))" },
    { name: "Absent", value: attendanceStats.absent, color: "hsl(var(--destructive))" },
    { name: "Late", value: attendanceStats.late, color: "hsl(var(--warning))" }
  ].filter(item => item.value > 0);

  // Trend data (last 7 records for mobile view)
  const recentTrend = allAttendance
    .slice(-7)
    .map((record, index) => ({
      date: format(new Date(record.date), "MMM dd"),
      present: record.status === "PRESENT" ? 1 : 0,
      index: index + 1
    }));

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 md:h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Analytics Dashboard */}
      {allAttendance.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <CalendarIconAlt className="w-4 h-4 text-primary" />
                  <span className="text-lg md:text-2xl font-bold text-primary">{attendanceStats.total}</span>
                  <p className="text-xs text-primary/80">Total Records</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-lg md:text-2xl font-bold text-success">{attendanceRate}%</span>
                  <p className="text-xs text-success/80">Attendance</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <BarChart3 className="w-4 h-4 text-secondary-foreground" />
                  <span className="text-lg md:text-2xl font-bold text-secondary-foreground">{punctualityRate}%</span>
                  <p className="text-xs text-secondary-foreground/80">Punctuality</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <PieChart className="w-4 h-4 text-warning" />
                  <span className="text-lg md:text-2xl font-bold text-warning">{attendanceStats.onDuty}</span>
                  <p className="text-xs text-warning/80">Duty Days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Attendance Distribution */}
            {pieData.length > 0 && (
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                    <PieChart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <span>Attendance Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
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
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Trend */}
            {recentTrend.length > 0 && (
              <Card className="border-0 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <span>Recent Attendance Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recentTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={[0, 1]}
                          tickFormatter={(value) => value === 1 ? 'Present' : 'Absent'}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value) => [value === 1 ? 'Present' : 'Absent', 'Status']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="present" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base md:text-lg flex items-center space-x-2">
            <Filter className="w-4 h-4 md:w-5 md:h-5" />
            <span>Filter Attendance Records</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Label htmlFor="date-filter" className="text-sm font-medium">Filter by Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Show all records"}
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
            {selectedDate && (
              <Button
                variant="ghost"
                onClick={() => setSelectedDate(null)}
                className="w-full md:w-auto"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredAttendance.length === 0 && selectedDate ? (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
            <CalendarIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No Data for Selected Date</h3>
            <p className="text-sm md:text-base text-muted-foreground px-4">
              No attendance data available for the selected date.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MemberAttendanceView data={filteredAttendance} />
      )}
    </div>
  );
}