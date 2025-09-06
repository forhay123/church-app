import React, { useEffect, useState, useCallback } from "react";
import { Mail, Church, Users, CheckCircle, XCircle, Loader2, Phone, Calendar, MapPin } from "lucide-react";
import { fetchUserProfile, fetchChurches, fetchDepartmentsNames } from "@/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Reusable component for a single profile detail row
const ProfileInfo = ({ icon, label, value }) => (
  <div className="flex items-center space-x-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground font-semibold">{value || "N/A"}</p>
    </div>
  </div>
);

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profile data and reference data simultaneously
      const [profileData, churchesData, departmentsData] = await Promise.all([
        fetchUserProfile(),
        fetchChurches(),
        fetchDepartmentsNames()
      ]);

      setUserProfile(profileData);
      setChurches(Array.isArray(churchesData) ? churchesData : churchesData?.data || []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);
    } catch (err) {
      console.error("❌ Profile data fetch failed:", err);
      setError("Unable to retrieve profile information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Get church name by ID
  const getChurchName = (churchId) => {
    if (!churchId) return "N/A";
    const church = churches.find(c => c.id === churchId);
    return church ? church.name : `Church ID: ${churchId}`;
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "N/A";
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : `Department ID: ${departmentId}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Profile</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/95">
        <CardHeader className="bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 p-6 sm:p-8 text-center border-b">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                <AvatarImage 
                  src={userProfile.photo_url} 
                  alt={`${userProfile.name}'s profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl">
                  {userProfile.name?.substring(0, 2)?.toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                {userProfile.is_active ? (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-4 border-background">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {userProfile.name || "User Profile"}
              </h1>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-sm font-medium capitalize px-3 py-1">
                  {userProfile.role ? userProfile.role.toLowerCase() : "No Role"}
                </Badge>
                <Badge 
                  variant={userProfile.is_active ? "default" : "destructive"} 
                  className="text-sm font-medium px-3 py-1"
                >
                  {userProfile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {userProfile.sex && (
                <Badge variant="outline" className="text-sm capitalize">
                  {userProfile.sex === "not_specified" ? "Not Specified" : userProfile.sex}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Contact Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileInfo
                icon={<Mail className="h-5 w-5" />}
                label="Email Address"
                value={userProfile.email}
              />
              <ProfileInfo
                icon={<Phone className="h-5 w-5" />}
                label="Phone Number"
                value={userProfile.phone}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileInfo
                icon={<Calendar className="h-5 w-5" />}
                label="Date of Birth"
                value={formatDate(userProfile.birthday)}
              />
              <ProfileInfo
                icon={<MapPin className="h-5 w-5" />}
                label="Address"
                value={userProfile.address}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Organization Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Organization Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileInfo
                icon={<Church className="h-5 w-5" />}
                label="Church"
                value={getChurchName(userProfile.church_id)}
              />
              <ProfileInfo
                icon={<Users className="h-5 w-5" />}
                label="Department"
                value={getDepartmentName(userProfile.department_id)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}