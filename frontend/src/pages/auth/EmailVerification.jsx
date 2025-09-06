// src/pages/auth/EmailVerification.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "@utils/apiClient";

export default function EmailVerification() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // extract token from query param
  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing or invalid.");
        return;
      }

      try {
        await apiClient.post("/auth/verify-email", { token });

        setStatus("success");
        setMessage("✅ Email verified successfully! Redirecting to login...");

        // redirect after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        const errorMsg =
          err.response?.data?.detail || "Verification failed. Please try again.";
        setStatus("error");
        setMessage(`❌ ${errorMsg}`);
      }
    }

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md text-center">
        {status === "loading" && (
          <p className="text-gray-600">⏳ Verifying your email...</p>
        )}
        {status === "success" && (
          <p className="text-green-600 font-medium">{message}</p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
