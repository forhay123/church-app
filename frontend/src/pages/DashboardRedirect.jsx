import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Redirect based on user role
    switch (user.role.toUpperCase()) {
      case "ADMIN":
        navigate("/admin");
        break;
      case "EXECUTIVE":
        navigate("/executive");
        break;
      case "HEAD_A":
        navigate("/finance");
        break;
      case "LEAD_PASTOR":
        navigate("/lead-pastor");
        break;
      case "PASTOR":
        navigate("/pastor");
        break;
      case "DEPARTMENT_LEADER":
        navigate("/department-leader");
        break;
      default:
        navigate("/member");
        break;
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}