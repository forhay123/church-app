import React, { useState, useEffect } from "react";
import { getPendingAccessCodes } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Mail, Clock, Globe, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const AccessCodeRequests = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const response = await getPendingAccessCodes();
      setCodes(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch access codes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Access code copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatPageRoute = (route) => {
    return route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-lg text-muted-foreground">Loading access requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Access Code Requests
              </h1>
              <p className="text-muted-foreground">
                Manage pending access requests from users
              </p>
            </div>
            <Button onClick={fetchCodes} variant="outline" className="group">
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="dashboard-card-icon bg-gradient-to-br from-primary/20 to-secondary/10 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{codes.length}</h3>
                <p className="text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {codes.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-12 text-center">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No Pending Requests
              </h3>
              <p className="text-muted-foreground">
                All access requests have been processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {codes.map((code, index) => (
              <Card key={code.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">Access Request</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Request #{code.id}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-medium">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Email</p>
                        <p className="text-sm font-semibold">{code.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Requested Page</p>
                        <p className="text-sm font-semibold">{formatPageRoute(code.page_route)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Access Code */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          Access Code
                        </p>
                        <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                          {code.code}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                        className="group"
                      >
                        <Copy className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Copy Code
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Instructions:</strong> Share this access code with {code.email} 
                      so they can access the requested page. The code will expire after use.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessCodeRequests;