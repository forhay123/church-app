import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifyAccessCode } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, KeyRound, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AccessVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageRoute = location.state?.pageRoute || "/";
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialEmail || !pageRoute) {
      toast({
        title: "Access Denied",
        description: "Please request a code first.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [initialEmail, pageRoute, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await verifyAccessCode(email, code, pageRoute);
      const accessToken = response?.data?.access_token;

      if (!accessToken) {
        throw new Error("No access token returned from server.");
      }

      localStorage.setItem("temp_access_token", accessToken);

      toast({
        title: "Success",
        description: "Access granted! Redirecting...",
      });

      // Force full reload with token available
      window.location.href = pageRoute;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.message ||
          "Invalid code or request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPageName = (route) => {
    return route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Access Verification
          </h1>
          <p className="text-muted-foreground">
            Enter your access code to continue
          </p>
        </div>

        {/* Verification Card */}
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Verify Access Code
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Requesting access to: <span className="font-semibold text-primary">{formatPageName(pageRoute)}</span>
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Information Alert */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                An admin has been notified of your request. Please enter the access code they provided.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    readOnly={!!initialEmail}
                    className={`pl-10 h-12 ${
                      initialEmail ? "bg-muted/50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Access Code Field */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Access Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter access code"
                    value={code}
                    // This change allows any case and any length
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium" 
                // This change disables the button only if the code field is empty
                disabled={loading || !code}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Access Code
                  </>
                )}
              </Button>

              {/* Back Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help? Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessVerification;
