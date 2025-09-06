import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

export default function AdminAttendanceAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Average</p>
                <p className="text-3xl font-bold text-primary">85%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Average</p>
                <p className="text-3xl font-bold text-secondary">78%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-3xl font-bold text-emerald-600">234</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services This Month</p>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Analytics Coming Soon</p>
            <p className="text-sm mt-2">Detailed attendance analytics and reporting will be available here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}