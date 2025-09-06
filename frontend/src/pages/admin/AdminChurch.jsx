import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchChurches as fetchChurchesApi, fetchDepartments, addChurch, addDepartment } from "@/utils/api";
import apiClient from "@/utils/apiClient";
import { 
  PlusCircle, 
  Building, 
  LayoutList, 
  Filter, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminChurch() {
  // Form states
  const [churchName, setChurchName] = useState("");
  const [churchLocation, setChurchLocation] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [selectedChurch, setSelectedChurch] = useState("");

  // Data states
  const [churches, setChurches] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);

  // Filter states
  const [selectedFilterChurchId, setSelectedFilterChurchId] = useState("all");
  const [selectedFilterDepartmentName, setSelectedFilterDepartmentName] = useState("all");
  const [churchSearchTerm, setChurchSearchTerm] = useState("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [addingChurch, setAddingChurch] = useState(false);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [error, setError] = useState("");

  const { toast } = useToast();

  // Filtered departments will be set by useEffect
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  // Load churches and departments on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update filtered departments when filters change
  useEffect(() => {
    let filtered = Array.isArray(allDepartments) ? [...allDepartments] : [];

    if (selectedFilterChurchId && selectedFilterChurchId !== "all") {
      filtered = filtered.filter(dept => dept.church_id === parseInt(selectedFilterChurchId));
    }

    if (selectedFilterDepartmentName && selectedFilterDepartmentName !== "all") {
      filtered = filtered.filter(dept => dept.name === selectedFilterDepartmentName);
    }

    if (departmentSearchTerm.trim()) {
      const searchLower = departmentSearchTerm.toLowerCase();
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchLower) ||
        getChurchName(dept.church_id).toLowerCase().includes(searchLower)
      );
    }

    setFilteredDepartments(filtered);
  }, [allDepartments, selectedFilterChurchId, selectedFilterDepartmentName, departmentSearchTerm, churches]);

  // Load initial data
  const loadData = async () => {
    setLoadingData(true);
    setError("");
    try {
      await Promise.all([loadChurches(), loadDepartments()]);
      toast({
        title: "Success",
        description: "Data loaded successfully.",
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Please refresh the page.");
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch churches
  const loadChurches = async () => {
    try {
      const res = await fetchChurchesApi();
      setChurches(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch churches", err);
      setChurches([]);
      throw err;
    }
  };

  // Fetch departments
  const loadDepartments = async () => {
    try {
      const res = await fetchDepartments();
      setAllDepartments(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
      setAllDepartments([]);
      throw err;
    }
  };

  // Add new church
  const handleAddChurch = async (e) => {
    e.preventDefault();
    if (!churchName.trim() || !churchLocation.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setAddingChurch(true);
    try {
      await addChurch(churchName.trim(), churchLocation.trim());
      
      setChurchName("");
      setChurchLocation("");
      await loadChurches();
      
      toast({
        title: "Success",
        description: `Church "${churchName.trim()}" registered successfully.`,
      });
    } catch (err) {
      console.error("Failed to create church", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to register church. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingChurch(false);
    }
  };

  // Add new department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!departmentName.trim() || !selectedChurch) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setAddingDepartment(true);
    try {
      await addDepartment(departmentName.trim(), parseInt(selectedChurch));
      
      const churchName = getChurchName(parseInt(selectedChurch));
      setDepartmentName("");
      setSelectedChurch("");
      await loadDepartments();
      
      toast({
        title: "Success",
        description: `Department "${departmentName.trim()}" added to ${churchName}.`,
      });
    } catch (err) {
      console.error("Failed to create department", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to register department. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingDepartment(false);
    }
  };

  // Helper: get church name by ID
  const getChurchName = (churchId) => {
    const church = Array.isArray(churches) ? churches.find((c) => c.id === churchId) : null;
    return church ? church.name : "Unknown Church";
  };

  // Filter and search logic
  const filteredChurches = churches.filter(church => {
    if (!churchSearchTerm.trim()) return true;
    const searchLower = churchSearchTerm.toLowerCase();
    return church.name.toLowerCase().includes(searchLower) ||
           church.location.toLowerCase().includes(searchLower);
  });

  // Statistics
  const totalChurches = churches.length;
  const totalDepartments = allDepartments.length;
  const activeDepartments = filteredDepartments.length;

  // Department names for filter dropdown
  const uniqueDepartmentNames = [...new Set(allDepartments.map(dept => dept.name))];

  // Helper: get church color class based on church ID
  const getChurchColorClass = (churchId) => {
    const colors = [
      "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20", 
      "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
      "from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20",
      "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
      "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20",
      "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20",
      "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20"
    ];
    return colors[(churchId - 1) % colors.length];
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedFilterChurchId("all");
    setSelectedFilterDepartmentName("all");
    setChurchSearchTerm("");
    setDepartmentSearchTerm("");
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">Church Management System</h3>
            <p className="text-lg text-muted-foreground">Loading your administration dashboard...</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Syncing church and department data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                    Church Administration
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Comprehensive management system for churches and departments
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={resetFilters} 
                variant="outline" 
                size="lg"
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
              <Button 
                onClick={loadData} 
                variant="outline" 
                size="lg"
                disabled={loading}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError("")}
                    className="h-auto p-1 text-destructive-foreground hover:text-destructive-foreground/80"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Churches</p>
                    <p className="text-4xl font-bold text-primary">{totalChurches}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                      <span>Active Registry</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building className="w-10 h-10 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-50/50 hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-blue-950/20 dark:to-blue-950/10">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Departments</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalDepartments}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                      <span>Organization Units</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50 transition-colors">
                    <LayoutList className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-emerald-50/50 hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-emerald-950/20 dark:to-emerald-950/10">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Filtered Results</p>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{activeDepartments}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Filter className="w-4 h-4 mr-1 text-emerald-500" />
                      <span>Current View</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 dark:bg-emerald-900/30 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registration Forms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Church */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PlusCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="block text-xl font-semibold">Register New Church</span>
                  <span className="text-sm font-normal text-muted-foreground">Add a new church to the system</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddChurch} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="church-name" className="text-sm font-semibold flex items-center space-x-2">
                    <Building className="w-4 h-4 text-primary" />
                    <span>Church Name *</span>
                  </Label>
                  <Input
                    id="church-name"
                    placeholder="e.g., Grace Community Church"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="h-12 shadow-sm border-muted-foreground/20 focus:border-primary/50"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="church-location" className="text-sm font-semibold flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Church Location *</span>
                  </Label>
                  <Input
                    id="church-location"
                    placeholder="e.g., Lagos, Nigeria"
                    value={churchLocation}
                    onChange={(e) => setChurchLocation(e.target.value)}
                    className="h-12 shadow-sm border-muted-foreground/20 focus:border-primary/50"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={addingChurch || !churchName.trim() || !churchLocation.trim()}
                  className="w-full h-12 shadow-sm hover:shadow-md text-base font-semibold"
                >
                  {addingChurch ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registering Church...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Register Church
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Department */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PlusCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="block text-xl font-semibold">Register New Department</span>
                  <span className="text-sm font-normal text-muted-foreground">Add a department to an existing church</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDepartment} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="department-name" className="text-sm font-semibold flex items-center space-x-2">
                    <LayoutList className="w-4 h-4 text-primary" />
                    <span>Department Name *</span>
                  </Label>
                  <Input
                    id="department-name"
                    placeholder="e.g., Youth Ministry, Choir, Ushers"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="h-12 shadow-sm border-muted-foreground/20 focus:border-primary/50"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="select-church" className="text-sm font-semibold flex items-center space-x-2">
                    <Building className="w-4 h-4 text-primary" />
                    <span>Select Church *</span>
                  </Label>
                  <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                    <SelectTrigger className="h-12 shadow-sm border-muted-foreground/20 focus:border-primary/50">
                      <SelectValue placeholder="Choose a church for this department" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id.toString()} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold">{church.name}</span>
                            <span className="text-sm text-muted-foreground">{church.location}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={addingDepartment || !selectedChurch || !departmentName.trim()}
                  className="w-full h-12 shadow-sm hover:shadow-md text-base font-semibold"
                >
                  {addingDepartment ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adding Department...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Add Department
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Churches Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="block text-2xl font-bold">Registered Churches</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {totalChurches} {totalChurches === 1 ? 'church' : 'churches'} in the system
                  </span>
                </div>
              </CardTitle>
              
              <div className="relative lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={churchSearchTerm}
                  onChange={(e) => setChurchSearchTerm(e.target.value)}
                  className="pl-12 h-12 shadow-sm border-muted-foreground/20 focus:border-primary/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredChurches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChurches.map((church) => (
                  <Card key={church.id} className="group shadow-md hover:shadow-lg transition-all border-0 bg-gradient-to-br from-background to-muted/20 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{church.name}</h3>
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm">{church.location}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            #{church.id}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Departments:</span>
                          <Badge variant="outline" className="text-sm font-semibold">
                            {allDepartments.filter(d => d.church_id === church.id).length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto">
                    <Building className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">No Churches Found</h3>
                    <p className="text-muted-foreground">
                      {churchSearchTerm.trim() 
                        ? "No churches match your search criteria. Try adjusting your search terms."
                        : "No churches have been registered yet. Register your first church above."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Filters Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-semibold">Advanced Department Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Search Departments</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by department or church..."
                    value={departmentSearchTerm}
                    onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                    className="pl-12 h-11 shadow-sm border-muted-foreground/20 focus:border-primary/50"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <Building className="w-4 h-4 text-primary" />
                  <span>Filter by Church</span>
                </Label>
                <Select value={selectedFilterChurchId} onValueChange={setSelectedFilterChurchId}>
                  <SelectTrigger className="h-11 shadow-sm border-muted-foreground/20 focus:border-primary/50">
                    <SelectValue placeholder="All churches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{church.name}</span>
                          <span className="text-xs text-muted-foreground">{church.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <LayoutList className="w-4 h-4 text-primary" />
                  <span>Filter by Department Type</span>
                </Label>
                <Select value={selectedFilterDepartmentName} onValueChange={setSelectedFilterDepartmentName}>
                  <SelectTrigger className="h-11 shadow-sm border-muted-foreground/20 focus:border-primary/50">
                    <SelectValue placeholder="All department types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Department Types</SelectItem>
                    {uniqueDepartmentNames.map((deptName) => (
                      <SelectItem key={deptName} value={deptName}>
                        {deptName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LayoutList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="block text-2xl font-bold">Department Directory</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Showing {activeDepartments} of {totalDepartments} departments
                  </span>
                </div>
              </CardTitle>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/20 px-4 py-2 rounded-lg">
                <Filter className="w-4 h-4" />
                <span>Active Filters: {[
                  selectedFilterChurchId !== "all" ? selectedFilterChurchId : null, 
                  selectedFilterDepartmentName !== "all" ? selectedFilterDepartmentName : null, 
                  departmentSearchTerm.trim()
                ].filter(Boolean).length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDepartments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => (
                  <Card key={dept.id} className={cn("group shadow-md hover:shadow-lg transition-all border-0 bg-gradient-to-br hover:scale-105", getChurchColorClass(dept.church_id))}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{dept.name}</h3>
                            <div className="flex items-center text-muted-foreground">
                              <Building className="w-4 h-4 mr-2 text-primary" />
                              <span className="text-sm font-medium">{getChurchName(dept.church_id)}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            #{dept.id}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Church ID:</span>
                          <Badge variant="outline" className="text-sm font-semibold">
                            {dept.church_id}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto">
                    <LayoutList className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">No Departments Found</h3>
                    <p className="text-muted-foreground">
                      {(selectedFilterChurchId !== "all" || selectedFilterDepartmentName !== "all" || departmentSearchTerm.trim())
                        ? "No departments match your current filters. Try adjusting your search criteria."
                        : "No departments have been registered yet. Create your first department above."
                      }
                    </p>
                  </div>
                  {(selectedFilterChurchId !== "all" || selectedFilterDepartmentName !== "all" || departmentSearchTerm.trim()) && (
                    <Button onClick={resetFilters} variant="outline" className="mt-4">
                      <Filter className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}