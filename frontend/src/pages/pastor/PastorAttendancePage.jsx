import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchChurchMembersAttendance, fetchChurchMembersAttendanceByDate } from "@/utils/api";
import PastorAttendanceList from "@/pages/pastor/Attendance/PastorAttendanceList";

export default function PastorAttendancePage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAttendance();
  }, []);

  // Filter data based on search term and date range
  useEffect(() => {
    let filtered = [...data];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(record => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return recordDate >= dateRange.from && recordDate <= dateRange.to;
      });
    }

    setFilteredData(filtered);
  }, [data, searchTerm, dateRange]);

  const loadAttendance = async (dateStr = null) => {
    setLoading(true);
    try {
      const res = dateStr
        ? await fetchChurchMembersAttendanceByDate(dateStr)
        : await fetchChurchMembersAttendance();
      
      setData(Array.isArray(res) ? res : []);
      
      toast({
        title: "Success",
        description: `Loaded ${Array.isArray(res) ? res.length : 0} attendance records`,
      });
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast({
        title: "Error",
        description: "Failed to load attendance records. Please try again.",
        variant: "destructive",
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      loadAttendance(dateStr);
    } else {
      loadAttendance();
    }
  };

  const handleRefresh = () => {
    setSelectedDate(null);
    setDateRange({ from: null, to: null });
    setSearchTerm("");
    loadAttendance();
  };

  const handleExportData = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const headers = ["Name", "Date", "Status", "Department"];
      const csvContent = [
        headers.join(","),
        ...filteredData.map(record => [
          `"${record.user_name || ""}"`,
          record.date || "",
          record.status || "",
          record.department_name || "N/A"
        ].join(","))
      ].join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `church-attendance-${format(new Date(), "yyyy-MM-dd")}.csv`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Church Attendance Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor and analyze member attendance patterns across your church
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="lg"
              disabled={loading}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            
            <Button 
              onClick={handleExportData} 
              size="lg"
              className="shadow-sm hover:shadow-md transition-shadow"
              disabled={loading || filteredData.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Controls Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Search className="w-5 h-5 text-primary" />
              <span>Search & Filter Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search Members */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Search Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by member name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Single Date Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Specific Date</Label>
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

              {/* Date Range From */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                      disabled={(date) => dateRange.from && date < dateRange.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleDateFilter} 
                disabled={loading}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Apply Date Filter
                  </>
                )}
              </Button>

              {(selectedDate || dateRange.from || dateRange.to || searchTerm) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedDate(null);
                    setDateRange({ from: null, to: null });
                    setSearchTerm("");
                  }}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {(selectedDate || dateRange.from || dateRange.to || searchTerm) && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm font-medium mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedDate && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                      Date: {format(selectedDate, "PPP")}
                    </span>
                  )}
                  {dateRange.from && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                      From: {format(dateRange.from, "PPP")}
                    </span>
                  )}
                  {dateRange.to && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800 border border-orange-200">
                      To: {format(dateRange.to, "PPP")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance List Component */}
      {loading ? (
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg font-medium text-muted-foreground">Loading attendance data...</p>
              <p className="text-sm text-muted-foreground">Please wait while we fetch the records</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PastorAttendanceList data={filteredData} />
      )}
    </div>
  );
}