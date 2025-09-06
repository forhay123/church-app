import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Settings, RefreshCw, Check, X, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// API helpers
import {
  fetchRoles,
  fetchRoleTargets,
  grantRoleToRole,
  revokeRoleToRole,
} from "@/utils/api";

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const { toast } = useToast();

  // Fetch all roles on mount
  useEffect(() => {
    setLoading(true);
    fetchRoles()
      .then((data) => {
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          setSelectedRole(data[0]);
        }
      })
      .catch(() => toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive"
      }))
      .finally(() => setLoading(false));
  }, []);

  // Fetch role-to-role permissions
  useEffect(() => {
    if (selectedRole) {
      setLoading(true);
      fetchRoleTargets(selectedRole)
        .then((data) => {
          const map = {};
          roles.forEach((r) => {
            map[r] = data.some((p) => p.target_role === r);
          });
          setTargets(map);
        })
        .catch(() => toast({
          title: "Error",
          description: "Failed to load role permissions",
          variant: "destructive"
        }))
        .finally(() => setLoading(false));
    }
  }, [selectedRole, roles]);

  // Toggle target role
  const handleToggle = async (targetRole, newValue) => {
    setSaving(prev => ({ ...prev, [targetRole]: true }));
    
    try {
      // Optimistically update the UI
      setTargets((prev) => ({ ...prev, [targetRole]: newValue }));

      if (newValue) {
        await grantRoleToRole(selectedRole, targetRole);
        toast({
          title: "Permission Granted",
          description: `${selectedRole} can now send to ${targetRole}`,
        });
      } else {
        await revokeRoleToRole(selectedRole, targetRole);
        toast({
          title: "Permission Revoked", 
          description: `${selectedRole} can no longer send to ${targetRole}`,
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update permission",
        variant: "destructive"
      });
      // Revert the UI on error
      setTargets((prev) => ({ ...prev, [targetRole]: !newValue }));
    } finally {
      setSaving(prev => ({ ...prev, [targetRole]: false }));
    }
  };

  const refreshData = () => {
    if (selectedRole) {
      fetchRoleTargets(selectedRole)
        .then((data) => {
          const map = {};
          roles.forEach((r) => {
            map[r] = data.some((p) => p.target_role === r);
          });
          setTargets(map);
          toast({
            title: "Data Refreshed",
            description: "Permissions updated successfully"
          });
        })
        .catch(() => toast({
          title: "Error",
          description: "Failed to refresh permissions",
          variant: "destructive"
        }));
    }
  };

  const formatRoleName = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getPermissionCount = () => {
    return Object.values(targets).filter(Boolean).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Role Permissions
              </h1>
              <p className="text-muted-foreground">
                Manage role-to-role messaging permissions
              </p>
            </div>
            <Button onClick={refreshData} variant="outline" className="group">
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Role Selector Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="dashboard-card-icon bg-gradient-to-br from-primary/20 to-secondary/10 text-primary">
                <Settings className="w-5 h-5" />
              </div>
              Select Role to Configure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Configure permissions for:
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a role to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {formatRoleName(role)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Active Permissions</p>
                  <div className="text-2xl font-bold text-primary">
                    {getPermissionCount()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Configuration */}
        {selectedRole && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dashboard-card-icon bg-gradient-to-br from-green-500/20 to-blue-500/10 text-green-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span>{formatRoleName(selectedRole)} Messaging Permissions</span>
                </div>
                <Badge variant="secondary" className="font-medium">
                  {getPermissionCount()} of {roles.filter(r => r !== selectedRole).length} roles
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Configure which roles <strong>{formatRoleName(selectedRole)}</strong> can send messages to
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading permissions...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {roles
                    .filter((r) => r !== selectedRole)
                    .map((targetRole, index) => (
                      <div key={targetRole}>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              targets[targetRole] 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {targets[targetRole] ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{formatRoleName(targetRole)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {targets[targetRole] ? 'Can receive messages' : 'Cannot receive messages'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {saving[targetRole] && (
                              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                            )}
                            <Checkbox
                              checked={targets[targetRole] || false}
                              onCheckedChange={(checked) =>
                                handleToggle(targetRole, checked === true)
                              }
                              disabled={saving[targetRole]}
                              className="h-5 w-5"
                            />
                          </div>
                        </div>
                        {index < roles.filter(r => r !== selectedRole).length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Permission Settings
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      When you enable a permission, users with the <strong>{formatRoleName(selectedRole)}</strong> role 
                      will be able to send messages to users with the target role. Changes take effect immediately.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedRole && !loading && (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                Select a Role to Begin
              </h3>
              <p className="text-muted-foreground">
                Choose a role from the dropdown above to configure its messaging permissions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}