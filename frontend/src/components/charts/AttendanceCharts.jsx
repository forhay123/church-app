import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Target } from "lucide-react";

// Color palette using design system
const COLORS = {
  present: 'hsl(142 69% 58%)',
  absent: 'hsl(0 84% 60%)',
  late: 'hsl(38 92% 50%)',
  onDuty: 'hsl(221 83% 53%)',
  primary: 'hsl(221 83% 53%)',
  secondary: 'hsl(43 96% 56%)',
  success: 'hsl(142 69% 58%)',
  warning: 'hsl(38 92% 50%)',
  error: 'hsl(0 84% 60%)'
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Attendance Status Pie Chart
export const AttendanceStatusChart = ({ stats }) => {
  const data = [
    { name: 'Present', value: stats.present || 0, color: COLORS.present },
    { name: 'Absent', value: stats.absent || 0, color: COLORS.absent },
    { name: 'Late', value: stats.late || 0, color: COLORS.late }
  ].filter(item => item.value > 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span>Attendance Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Attendance Rate Radial Chart
export const AttendanceRateChart = ({ stats }) => {
  const total = stats.total || 1;
  const attendanceRate = Math.round(((stats.present + stats.late) / total) * 100);
  const data = [
    { name: 'Present', value: attendanceRate, fill: COLORS.success }
  ];

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-success/5 to-success/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="p-2 bg-success/10 rounded-lg">
            <Target className="w-4 h-4 text-success" />
          </div>
          <span>Attendance Rate</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data}>
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                fill={COLORS.success}
                stroke="none"
              />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold fill-success"
              >
                {attendanceRate}%
              </text>
              <text 
                x="50%" 
                y="50%" 
                dy={25}
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm fill-muted-foreground"
              >
                Attendance Rate
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Department Attendance Bar Chart
export const DepartmentAttendanceChart = ({ members, departments }) => {
  const departmentStats = departments.map(dept => {
    const deptMembers = members.filter(m => m.department_id === dept.id);
    const present = deptMembers.filter(m => m.status === "PRESENT").length;
    const total = deptMembers.length;
    
    return {
      name: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
      fullName: dept.name,
      present,
      absent: total - present,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }).filter(dept => dept.total > 0);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span>Department Attendance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-card-foreground">{data.fullName}</p>
                        <p className="text-sm text-success">Present: {data.present}</p>
                        <p className="text-sm text-error">Absent: {data.absent}</p>
                        <p className="text-sm text-muted-foreground">Rate: {data.rate}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="present" fill={COLORS.present} radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill={COLORS.absent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// On Duty Status Chart
export const OnDutyChart = ({ stats }) => {
  const data = [
    { name: 'On Duty', value: stats.onDuty || 0, color: COLORS.primary },
    { name: 'Available', value: (stats.present + stats.late - stats.onDuty) || 0, color: COLORS.secondary }
  ].filter(item => item.value > 0);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <span>Duty Assignment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Weekly Trend Chart (Mock data for now)
export const WeeklyTrendChart = ({ currentStats }) => {
  // Generate mock weekly data for demonstration
  const weeklyData = [
    { day: 'Mon', present: Math.max(0, (currentStats?.present || 0) - 5), absent: Math.max(0, (currentStats?.absent || 0) + 3) },
    { day: 'Tue', present: Math.max(0, (currentStats?.present || 0) - 3), absent: Math.max(0, (currentStats?.absent || 0) + 1) },
    { day: 'Wed', present: Math.max(0, (currentStats?.present || 0) - 7), absent: Math.max(0, (currentStats?.absent || 0) + 5) },
    { day: 'Thu', present: Math.max(0, (currentStats?.present || 0) - 2), absent: Math.max(0, (currentStats?.absent || 0) + 2) },
    { day: 'Fri', present: Math.max(0, (currentStats?.present || 0) + 2), absent: Math.max(0, (currentStats?.absent || 0) - 2) },
    { day: 'Sat', present: Math.max(0, (currentStats?.present || 0) - 1), absent: Math.max(0, (currentStats?.absent || 0) + 1) },
    { day: 'Sun', present: currentStats?.present || 0, absent: currentStats?.absent || 0 }
  ];

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span>Weekly Trend</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke={COLORS.present} 
                strokeWidth={3}
                dot={{ r: 4, fill: COLORS.present }}
                name="Present"
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke={COLORS.absent} 
                strokeWidth={3}
                dot={{ r: 4, fill: COLORS.absent }}
                name="Absent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};