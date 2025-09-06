// src/pages/member/SelfAttendance.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import apiClient from "@/utils/apiClient"; // Use apiClient
import { Loader2 } from "lucide-react"; // For a loading spinner

export default function SelfAttendance() {
  const { token } = useParams(); // Get the QR token from the URL
  const navigate = useNavigate();
  const location = useLocation(); // To get the current path for redirection
  const [status, setStatus] = useState("Loading attendance status...");
  const [loading, setLoading] = useState(true);
  const [markAttempted, setMarkAttempted] = useState(false); // To ensure markAttendance runs only once initially

  useEffect(() => {
    // This effect handles the initial attempt to mark attendance
    const attemptMarkAttendance = async () => {
      if (!token) {
        setStatus("Error: No attendance token provided in the URL.");
        setLoading(false);
        setMarkAttempted(true);
        return;
      }

      // We set markAttempted to true to prevent this effect from running again immediately
      // and to differentiate initial loading from potential retries.
      if (markAttempted) return;
      setMarkAttempted(true);

      setLoading(true);
      setStatus("Marking attendance..."); // Update status while marking
      try {
        // apiClient automatically adds the Authorization header if a token exists in localStorage
        const res = await apiClient.post(`/attendance-qr/${token}`); 
        setStatus(res.data.detail);
        setLoading(false);
      } catch (err) {
        console.error("Error marking attendance:", err);
        if (err.response && err.response.status === 401) {
          // If unauthorized, it means the user token is missing or invalid in this context.
          // Redirect to login, passing the current path so they can return here after logging in.
          setStatus("Authentication required. Redirecting to login...");
          navigate("/login", { state: { redirectTo: location.pathname } });
        } else {
          // Other types of errors
          setStatus(err.response?.data?.detail || "Error marking attendance. Please try again.");
          setLoading(false);
        }
      }
    };

    attemptMarkAttendance();
  }, [token, navigate, location.pathname, markAttempted]); // Depend on token and navigation/location for consistency

  // The button for manual marking is removed, as it should be automatic.
  // The UI will display status messages.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 space-y-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Attendance Status</h2>
        
        {loading ? (
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{status}</span>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">{status}</p>
        )}
        
        {/* Optional: Add a button to manually refresh or retry if an error occurred,
            but not if it's a 401 leading to login. */}
        {status && status !== "Attendance marked successfully" && !loading && 
         !status.includes("Authentication required") && (
            <button
              onClick={() => setMarkAttempted(false)} // Reset to re-attempt marking
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4"
            >
              Retry
            </button>
        )}
      </div>
    </div>
  );
}
