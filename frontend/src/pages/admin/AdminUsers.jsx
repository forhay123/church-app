import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  fetchUsers,
  fetchChurches,
  fetchDepartmentsNames,
  fetchRoles,
  updateUser,
  uploadUserPhoto,
  getFullImageUrl,
} from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  Loader2, 
  Users,
  Building,
  UserCheck,
  RefreshCw,
  Download,
  Calendar,
  Phone,
  MapPin,
  Camera,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Filters state
  const [filters, setFilters] = useState({
    name: "",
    church: "all",
    department: "all",
    role: "all",
    sex: "all",
    birthMonth: "all"
  });

  // Dynamic filter options
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Create memoized maps for fast lookups
  const churchNameMap = useMemo(() => {
    return churches.reduce((acc, church) => {
      if (church && church.id) {
        acc[church.id] = church.name;
      }
      return acc;
    }, {});
  }, [churches]);

  const departmentNameMap = useMemo(() => {
    return departments.reduce((acc, dept) => {
      if (dept && dept.id) {
        acc[dept.id] = dept.name;
      }
      return acc;
    }, {});
  }, [departments]);

  // Fetches all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [churchesData, departmentsData, rolesData, usersData] =
          await Promise.all([
            fetchChurches(),
            fetchDepartmentsNames(),
            fetchRoles(),
            fetchUsers(),
          ]);

        // Safely set state, ensuring data is an array
        setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
        setAllUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        const errorMessage = err.response?.data?.detail || err.message || "Failed to load data. Please try again later.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handler to open the edit dialog and pre-fill form
  const handleEditClick = useCallback((user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      department_id: user.department_id?.toString() || "none",
      church_id: user.church_id?.toString() || "none",
      address: user.address || "",
      birthday: user.birthday || "",
      phone: user.phone || "",
      sex: user.sex || "",
      photo_url: user.photo_url || "",
    });
    setPhotoPreview(user.photo_url || "");
    setPhotoFile(null);
    setIsEditDialogOpen(true);
  }, []);

  // Handler for photo file upload
  const handlePhotoFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear URL field when file is selected
      setEditFormData(prev => ({ ...prev, photo_url: "" }));
    }
  }, [toast]);

  // Handler for form input changes
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    
    // If photo URL is being entered, clear file upload
    if (name === 'photo_url' && value) {
      setPhotoFile(null);
      setPhotoPreview(value);
    }
  }, []);

  // Handler for select input changes
  const handleSelectChange = useCallback((name, value) => {
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handler to clear photo
  const clearPhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreview("");
    setEditFormData(prev => ({ ...prev, photo_url: "" }));
  }, []);

  // Handler to save changes from the edit dialog
  const saveChanges = async () => {
    if (!editingUser) return;
    setSaving(true);
    setError("");
    
    try {
      let finalPhotoUrl = editFormData.photo_url;
      
      // If a file was uploaded, use the upload API
      if (photoFile) {
        try {
          const uploadResult = await uploadUserPhoto(editingUser.id, photoFile);
          finalPhotoUrl = uploadResult.photo_url;
        } catch (uploadError) {
          console.error("Photo upload error:", uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload the image. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        role: editFormData.role,
        department_id: editFormData.department_id === "none" ? null : parseInt(editFormData.department_id),
        church_id: editFormData.church_id === "none" ? null : parseInt(editFormData.church_id),
        address: editFormData.address.trim(),
        birthday: editFormData.birthday || null,
        phone: editFormData.phone.trim(),
        sex: editFormData.sex,
      };

      // Only include photo_url if it's a URL (not from file upload)
      if (!photoFile && editFormData.photo_url) {
        payload.photo_url = editFormData.photo_url;
      }

      // Make API call to update user
      const updatedUser = await updateUser(editingUser.id, payload);

      // Update local state with the final photo URL
      setAllUsers((prev) =>
        prev.map((u) => u.id === editingUser.id ? { ...updatedUser, photo_url: finalPhotoUrl || updatedUser.photo_url } : u)
      );
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setPhotoFile(null);
      setPhotoPreview("");
      
      toast({
        title: "Success",
        description: photoFile ? "User updated successfully with new photo." : "User updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update user:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to save changes. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handler to initiate the delete confirmation dialog
  const handleDeleteClick = useCallback((user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler to perform the deletion
  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSaving(true);
    setError("");
    
    try {
      // In a real application, you would make an API call here
      // await deleteUser(userToDelete.id);

      // Simulate API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to delete user. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtering logic
  const filteredUsers = useMemo(() => {
    let temp = [...allUsers];

    if (filters.name.trim()) {
      temp = temp.filter((user) =>
        user.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.church !== "all") {
      temp = temp.filter(
        (user) => String(user.church_id) === String(filters.church)
      );
    }
    if (filters.department !== "all") {
      temp = temp.filter((user) =>
        String(user.department_id) === String(filters.department)
      );
    }
    if (filters.role !== "all") {
      temp = temp.filter(
        (user) => user.role === filters.role
      );
    }
    if (filters.sex !== "all") {
      temp = temp.filter(
        (user) => user.sex === filters.sex
      );
    }
    if (filters.birthMonth !== "all") {
      temp = temp.filter((user) => {
        if (!user.birthday) return false;
        const birthDate = new Date(user.birthday);
        return (birthDate.getMonth() + 1) === parseInt(filters.birthMonth);
      });
    }

    return temp;
  }, [allUsers, filters]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleExportCSV = useCallback(() => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No Data",
        description: "No users to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["S/N", "ID", "Name", "Email", "Role", "Department", "Church", "Address", "Birthday", "Phone", "Sex", "Photo URL"];
      const csvContent = [
        headers.join(","),
        ...filteredUsers.map((user, index) => [
          index + 1,
          user.id,
          `"${user.name || ""}"`,
          `"${user.email || ""}"`,
          `"${user.role || ""}"`,
          `"${departmentNameMap[user.department_id] || ""}"`,
          `"${churchNameMap[user.church_id] || ""}"`,
          `"${user.address || ""}"`,
          `"${user.birthday || ""}"`,
          `"${user.phone || ""}"`,
          `"${user.sex || ""}"`,
          `"${user.photo_url || ""}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Users data has been exported to CSV file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export users data.",
        variant: "destructive",
      });
    }
  }, [filteredUsers, departmentNameMap, churchNameMap, toast]);

  // Statistics
  const totalUsers = allUsers.length;
  const totalChurches = new Set(allUsers.map(u => u.church_id).filter(Boolean)).size;
  const totalDepartments = new Set(allUsers.map(u => u.department_id).filter(Boolean)).size;

  // Get unique birth months for filter
  const birthMonths = useMemo(() => {
    const months = [
      { value: "1", label: "January" },
      { value: "2", label: "February" },
      { value: "3", label: "March" },
      { value: "4", label: "April" },
      { value: "5", label: "May" },
      { value: "6", label: "June" },
      { value: "7", label: "July" },
      { value: "8", label: "August" },
      { value: "9", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" }
    ];
    return months;
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage all users, their roles, and permissions
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
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              onClick={handleExportCSV} 
              variant="outline"
              size="lg"
              disabled={loading || filteredUsers.length === 0}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError("")}
                className="ml-2 h-auto p-0 text-destructive-foreground underline"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/95 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{totalUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-50/50 hover:shadow-xl transition-shadow dark:from-blue-950/20 dark:to-blue-950/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Churches</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalChurches}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-emerald-50/50 hover:shadow-xl transition-shadow dark:from-emerald-950/20 dark:to-emerald-950/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departments</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalDepartments}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <UserCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Filter className="w-5 h-5 text-primary" />
            <span>User Management Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name-search">Search by Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name-search"
                placeholder="Search users by name..."
                value={filters.name}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, name: e.target.value }))
                }
                className="pl-10 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filter by Church</Label>
            <Select
              value={filters.church}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, church: value }))
              }
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="All Churches" />
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

          <div className="space-y-2">
            <Label>Filter by Department</Label>
            <Select
              value={filters.department}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, department: value }))
              }
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="All Departments" />
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

          <div className="space-y-2">
            <Label>Filter by Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter by Gender</Label>
            <Select
              value={filters.sex}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sex: value }))
              }
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="not_specified">Not Specified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter by Birth Month</Label>
            <Select
              value={filters.birthMonth}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, birthMonth: value }))
              }
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {birthMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Users className="w-5 h-5 text-primary" />
            <span>All Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px] font-semibold">S/N</TableHead>
                  <TableHead className="w-[60px] font-semibold">Photo</TableHead>
                  <TableHead className="w-[80px] font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Church</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Gender</TableHead>
                  <TableHead className="font-semibold">Birthday</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="w-[120px] text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-primary">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={getFullImageUrl(user.photo_url)} // 👈 Use the new function here
                              alt={user.name}
                              onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.name?.substring(0, 2)?.toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {user.role || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {departmentNameMap[user.department_id] || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {churchNameMap[user.church_id] || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {user.sex ? (
                          <Badge variant="outline" className="capitalize">
                            {user.sex === "not_specified" ? "Not Specified" : user.sex}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.birthday)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {user.address || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditClick(user)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(user)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">No users found</h3>
                      <p>No users match the selected filter criteria.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[95vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-primary" />
                <span>Edit User: {editingUser.name}</span>
              </DialogTitle>
              <DialogDescription>
                Update user information and save the changes.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-1">
              <div className="grid gap-6 py-4 pr-3">
                {/* Photo Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Profile Photo</h3>
                  
                  <div className="flex items-start space-x-6">
                    <div className="text-center space-y-2">
                      <Avatar className="w-24 h-24 mx-auto">
                        <AvatarImage src={photoPreview} alt="Profile preview" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                          {editFormData.name?.substring(0, 2)?.toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      {(photoPreview || photoFile) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearPhoto}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="photo-file" className="text-sm font-medium flex items-center space-x-1">
                          <Upload className="w-4 h-4" />
                          <span>Upload Photo File</span>
                        </Label>
                        <Input
                          id="photo-file"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="shadow-sm"
                        />
                        <p className="text-xs text-muted-foreground">Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="photo_url" className="text-sm font-medium flex items-center space-x-1">
                          <ImageIcon className="w-4 h-4" />
                          <span>Photo URL</span>
                        </Label>
                        <Input
                          id="photo_url"
                          name="photo_url"
                          type="url"
                          value={editFormData.photo_url}
                          onChange={handleFormChange}
                          placeholder="https://example.com/photo.jpg"
                          className="shadow-sm"
                          disabled={!!photoFile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Full Name</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        placeholder="Enter full name"
                        className="shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={editFormData.email}
                        onChange={handleFormChange}
                        placeholder="Enter email address"
                        className="shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={editFormData.phone}
                        onChange={handleFormChange}
                        placeholder="Enter phone number"
                        className="shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-sm font-medium flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Date of Birth</span>
                      </Label>
                      <Input
                        id="birthday"
                        name="birthday"
                        type="date"
                        value={editFormData.birthday}
                        onChange={handleFormChange}
                        className="shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-sm font-medium">Gender</Label>
                      <Select
                        value={editFormData.sex}
                        onValueChange={(value) => handleSelectChange("sex", value)}
                      >
                        <SelectTrigger className="shadow-sm">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not specified</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>Address</span>
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={editFormData.address}
                      onChange={handleFormChange}
                      placeholder="Enter full address"
                      className="shadow-sm min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Organization Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Organization Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                      <Select
                        value={editFormData.role}
                        onValueChange={(value) => handleSelectChange("role", value)}
                      >
                        <SelectTrigger className="shadow-sm">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="church_id" className="text-sm font-medium">Church</Label>
                      <Select
                        value={editFormData.church_id}
                        onValueChange={(value) => handleSelectChange("church_id", value)}
                      >
                        <SelectTrigger className="shadow-sm">
                          <SelectValue placeholder="Select a church" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Church</SelectItem>
                          {churches.map((church) => (
                            <SelectItem key={church.id} value={church.id.toString()}>
                              {church.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department_id" className="text-sm font-medium">Department</Label>
                    <Select
                      value={editFormData.department_id}
                      onValueChange={(value) => handleSelectChange("department_id", value)}
                    >
                      <SelectTrigger className="shadow-sm">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
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
            </ScrollArea>
            
            <DialogFooter className="gap-2 pt-4 border-t flex-shrink-0">
              <DialogClose asChild>
                <Button variant="outline" disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button onClick={saveChanges} disabled={saving} className="shadow-sm">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to permanently delete the user{" "}
                <span className="font-semibold text-foreground">{userToDelete.name}</span>?
                <br />
                <span className="text-destructive font-medium">This action cannot be undone.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}