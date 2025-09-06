import React, { useEffect, useState } from "react";
import { Search, UserPlus, Mail, Phone, Calendar, Users, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
// 🆕 Changed import to use the new function
import { fetchMyDepartmentMembers } from "@/utils/api";

export default function DepartmentMembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs on component mount and whenever the user's department ID changes.
    // It's the primary trigger for fetching member data.
    loadMembers();
  }, [user?.department_id]);

  useEffect(() => {
    // This effect filters the member list whenever the original members list or the search term changes.
    // It's crucial for the search functionality.
    if (searchTerm.trim()) {
      const filtered = members.filter(member =>
        // Changed to use member.name directly for consistency with the API response
        (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.role || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [members, searchTerm]);

  const loadMembers = async () => {
    // Ensure a department ID is available before making the API call.
    if (!user?.department_id) {
      setError("Department not found. Please contact your administrator.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // 🆕 Call the new API function which doesn't need a parameter.
      const data = await fetchMyDepartmentMembers();
      const membersArray = Array.isArray(data) ? data : [];
      
      setMembers(membersArray);
      setLastUpdated(new Date());
      
      toast({
        title: "Success",
        description: `Loaded ${membersArray.length} department members`,
      });
      
    } catch (err) {
      console.error("Failed to fetch department members:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to load department members.";
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

  const handleRefresh = () => {
    loadMembers();
  };

  const getRoleColor = (role) => {
    const roleStr = (role || "").toLowerCase();
    switch (roleStr) {
      case "admin":
      case "pastor":
        return "bg-red-100 text-red-800 border-red-200";
      case "leader":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "member":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getInitials = (name) => {
    if (!name) return "N/A";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-medium text-muted-foreground">Loading department members...</p>
              <p className="text-sm text-muted-foreground">Please wait while we fetch the member data</p>
            </div>
          </CardContent>
        </Card>
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
              Department Members
            </h1>
            <div className="flex items-center space-x-2">
              <p className="text-lg text-muted-foreground">
                {user.department_name || "Department"} • {filteredMembers.length} member(s)
              </p>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="lg"
              disabled={loading}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Stats Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card via-card to-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Users className="w-5 h-5 text-primary" />
              <span>Member Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Members</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold text-primary">{members.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/70" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Leaders</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {members.filter(m => m.role?.toLowerCase() === "leader").length}
                    </p>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-500/70" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                    <p className="text-2xl font-bold text-green-600">
                      {members.filter(m => m.role?.toLowerCase() === "member").length}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Showing</p>
                    <p className="text-2xl font-bold text-orange-600">{filteredMembers.length}</p>
                  </div>
                  <Search className="h-8 w-8 text-orange-500/70" />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Department Members ({filteredMembers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-6 rounded-xl border bg-gradient-to-r from-card to-card/50 hover:from-accent/20 hover:to-accent/5 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex-shrink-0 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-primary">
                        {getInitials(member.name)} {/* Changed to use member.name */}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg text-foreground">
                            {member.name || "Unknown Member"} {/* Changed to use member.name */}
                          </h3>
                          <Badge 
                            className={`text-xs font-medium ${getRoleColor(member.role)}`}
                            variant="outline"
                          >
                            {member.role?.toLowerCase() || "member"}
                          </Badge>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {member.email && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        
                        {member.phone && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        
                        {member.created_at && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      {(member.position || member.status) && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-2">
                            {member.position && (
                              <Badge variant="outline" className="text-xs">
                                {member.position}
                              </Badge>
                            )}
                            {member.status && (
                              <Badge 
                                variant={member.status === "active" ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {member.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? "No matching members found" : "No members found"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {searchTerm 
                  ? `No members match your search for "${searchTerm}". Try adjusting your search terms.`
                  : "There are no members in your department yet. Members will appear here once they join your department."
                }
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mr-3"
                >
                  Clear Search
                </Button>
              )}
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
