import React, { useEffect, useState, useMemo } from "react";
import {
  fetchUsers,
  fetchChurches,
  fetchDepartmentsNames,
  fetchRoles,
  fetchGistCenters,
} from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Building2, 
  Briefcase, 
  MapPin, 
  UserCheck,
  Filter,
  Search,
  TrendingUp,
  UsersIcon
} from "lucide-react";

const GlobalMember = () => {
  const [users, setUsers] = useState([]);
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [gistCenters, setGistCenters] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    role: "all",
    department: "all",
    church: "all",
    gistCenter: "all",
  });
  const [loading, setLoading] = useState(true);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, churchesData, departmentsData, rolesData, gistCentersData] =
          await Promise.all([
            fetchUsers(),
            fetchChurches(),
            fetchDepartmentsNames(),
            fetchRoles(),
            fetchGistCenters(),
          ]);

        setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
        setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
        setGistCenters(Array.isArray(gistCentersData) ? gistCentersData : gistCentersData?.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper functions
  const getChurchName = (id) =>
    churches.find((c) => c.id === id)?.name || "—";
  const getDepartmentName = (id) =>
    departments.find((d) => d.id === id)?.name || "—";
  const getGistCenterName = (id) =>
    gistCenters.find((g) => g.id === id)?.name || "—";

  // Enhanced filtering with memoization
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesName = u.name
        ?.toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchesRole = filters.role === "all" || u.role === filters.role;
      const matchesDept = filters.department === "all" || u.department_id?.toString() === filters.department;
      const matchesChurch = filters.church === "all" || u.church_id?.toString() === filters.church;
      const matchesGistCenter = filters.gistCenter === "all" || u.gist_center_id?.toString() === filters.gistCenter;

      return matchesName && matchesRole && matchesDept && matchesChurch && matchesGistCenter;
    });
  }, [users, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const roleStats = {};
    const churchStats = {};
    const deptStats = {};

    filteredUsers.forEach(user => {
      // Role statistics
      if (user.role) {
        roleStats[user.role] = (roleStats[user.role] || 0) + 1;
      }
      
      // Church statistics
      const churchName = getChurchName(user.church_id);
      if (churchName !== "—") {
        churchStats[churchName] = (churchStats[churchName] || 0) + 1;
      }
      
      // Department statistics
      const deptName = getDepartmentName(user.department_id);
      if (deptName !== "—") {
        deptStats[deptName] = (deptStats[deptName] || 0) + 1;
      }
    });

    return {
      total: totalUsers,
      topRole: Object.keys(roleStats).reduce((a, b) => roleStats[a] > roleStats[b] ? a : b, ""),
      topChurch: Object.keys(churchStats).reduce((a, b) => churchStats[a] > churchStats[b] ? a : b, ""),
      topDepartment: Object.keys(deptStats).reduce((a, b) => deptStats[a] > deptStats[b] ? a : b, ""),
      roleCount: Object.keys(roleStats).length,
      churchCount: Object.keys(churchStats).length,
      deptCount: Object.keys(deptStats).length
    };
  }, [filteredUsers, getChurchName, getDepartmentName]);

  // Role color mapping
  const getRoleColor = (role) => {
    const roleColors = {
      'ADMIN': 'bg-destructive text-destructive-foreground',
      'HEAD_A': 'bg-primary text-primary-foreground',
      'PASTOR': 'bg-success text-success-foreground',
      'MEMBER': 'bg-secondary text-secondary-foreground',
      'GUEST': 'bg-muted text-muted-foreground'
    };
    return roleColors[role] || 'bg-accent text-accent-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading member data...</p>
        </div>
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
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
            Global Members Directory
          </h1>
          <p className="text-muted-foreground">Comprehensive member management and analytics</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
                  <p className="text-3xl font-bold text-success">{stats.roleCount}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <Briefcase className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Churches</p>
                  <p className="text-3xl font-bold text-warning">{stats.churchCount}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departments</p>
                  <p className="text-3xl font-bold text-accent">{stats.deptCount}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Statistics */}
        {stats.total > 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Top Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-card/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Most Common Role</p>
                  <p className="text-lg font-semibold text-primary">{stats.topRole || "N/A"}</p>
                </div>
                <div className="text-center p-4 bg-card/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Largest Church</p>
                  <p className="text-lg font-semibold text-success">{stats.topChurch || "N/A"}</p>
                </div>
                <div className="text-center p-4 bg-card/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Largest Department</p>
                  <p className="text-lg font-semibold text-warning">{stats.topDepartment || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    className="h-11 pl-10 border-border/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.filter(Boolean).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
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
                    {departments.filter(d => d.id).map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Church</Label>
                <Select value={filters.church} onValueChange={(value) => setFilters({ ...filters, church: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All Churches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.filter(c => c.id).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gist Center</Label>
                <Select value={filters.gistCenter} onValueChange={(value) => setFilters({ ...filters, gistCenter: value })}>
                  <SelectTrigger className="h-11 border-border/50 focus:border-primary">
                    <SelectValue placeholder="All Gist Centers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gist Centers</SelectItem>
                    {gistCenters.filter(g => g.id).map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        {filteredUsers.length > 0 ? (
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Member Directory
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
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="font-semibold">Church</TableHead>
                      <TableHead className="font-semibold">Gist Center</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            {u.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(u.role)}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {getDepartmentName(u.department_id)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {getChurchName(u.church_id)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {getGistCenterName(u.gist_center_id)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Members Found</h3>
                <p className="text-muted-foreground">No members found matching the selected filters.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GlobalMember;