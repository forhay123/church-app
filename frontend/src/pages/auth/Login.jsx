import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Mail, Lock } from "lucide-react";
import apiClient from "../../utils/apiClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await apiClient.post("/auth/token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const data = res.data;

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user", JSON.stringify(data));

      toast.success("Login successful!");

      const redirectTo = location.state?.redirectTo;
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        switch (data.role) {
          case "ADMIN":
            navigate("/admin", { replace: true });
            break;
          case "EXECUTIVE":
            navigate("/executive", { replace: true });
            break;
          case "HEAD_A":
            navigate("/finance", { replace: true });
            break;
          case "LEAD_PASTOR":
            navigate("/lead-pastor", { replace: true });
            break;
          case "PASTOR":
            navigate("/pastor", { replace: true });
            break;
          case "DEPARTMENT_LEADER":
            navigate("/department-leader", { replace: true });
            break;
          case "MEMBER":
          default:
            navigate("/member", { replace: true });
            break;
        }
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Server error. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 dark:from-black dark:to-gray-950 p-4">
      <Card className="w-full max-w-sm p-6 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to continue to your dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="sr-only">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-700 dark:focus:ring-gray-300 focus:border-gray-700 dark:focus:border-gray-300"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-700 dark:focus:ring-gray-300 focus:border-gray-700 dark:focus:border-gray-300"
                  required
                />
              </div>
              {/* 🔗 Forgot password link */}
              <div className="text-right mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-semibold py-2 rounded-lg shadow-md transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-gray-900 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-400 transition-colors duration-300"
            >
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
