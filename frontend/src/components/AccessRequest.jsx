import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestAccessCode } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { Shield, Mail } from "lucide-react";

const AccessRequest = ({ pageRoute }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Attempting to send request...");
    setLoading(true);
    try {
      await requestAccessCode(email, pageRoute);
      toast({
        title: "Request Sent Successfully",
        description: "An admin has been notified. They will provide you with an access code shortly.",
      });
      // Navigate to the verification page, passing the pageRoute in state
      navigate("/verify-access", { state: { pageRoute, email } }); 
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error.response?.data?.detail || "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="dashboard-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Required</h2>
            <p className="text-muted-foreground">
              This page is restricted. Please request access from an administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">
                Your Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What happens next:</strong>
                <br />
                1. An admin will be notified of your request
                <br />
                2. You'll receive an access code
                <br />
                3. Enter the code to access this page
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Request Access Code
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessRequest;