import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // ✅ use hook, not components

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast(); // ✅ get toast function from hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reset link sent! Please check your email.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Error sending reset email",
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
          Forgot Password
        </h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
