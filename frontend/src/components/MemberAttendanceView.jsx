import React from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MemberAttendanceView({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Attendance Data</h3>
          <p className="text-muted-foreground">
            No attendance records found. Check back after the next service!
          </p>
        </CardContent>
      </Card>
    );
  }

  const presentCount = data.filter(item => item.status?.toLowerCase() === 'present').length;
  const attendanceRate = data.length > 0 ? Math.round((presentCount / data.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold text-primary">{data.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold text-secondary">{attendanceRate}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                %
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(item.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    {item.serviceType && (
                      <p className="text-sm text-muted-foreground">{item.serviceType}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={item.status?.toLowerCase() === 'present' ? 'default' : 'destructive'}
                  className={
                    item.status?.toLowerCase() === 'present'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
                  }
                >
                  {item.status?.toLowerCase() === 'present' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {item.status?.toLowerCase() === 'present' ? 'Present' : 'Absent'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}