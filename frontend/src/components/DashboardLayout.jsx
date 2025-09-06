import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            {/* The Outlet component will render the child routes here */}
            <Outlet />
          </div>
        </main>
      </div>

      <ThemeToggle />
    </div>
  );
}