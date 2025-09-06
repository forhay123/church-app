import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // ✅ use hook, not components

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast(); // ✅ get toast function from hook

  // Extract token from query string
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid or missing token",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset successfully!",
        });
        navigate("/login");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Error resetting password",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-950 p-6 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Reset Password
        </h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
