import React from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to landing page
  return <Navigate to="/landing" replace />;
};

export default Index;
