import React from "react";
import { Menu, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar({ onMenuClick }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("temp_access_token");
    // ✅ CORRECTED: Use the base path defined in vite.config.js for redirection
    window.location.href = "/workforce/login";
  };

  const handleProfileClick = () => {
    // ✅ CORRECTED: Use the base path defined in vite.config.js for redirection
    window.location.href = "/workforce/profile";
  };

  return (
    <header className="h-16 bg-card border-b border-border shadow-sm flex items-center justify-between px-4 lg:px-6 relative z-40">
      {/* Left side - Menu button and branding */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md">
            <span className="text-sm font-bold text-primary-foreground">L</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">LOGIC</h1>
        </div>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-3 h-auto p-2 rounded-xl hover:bg-accent focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            >
              <Avatar className="w-8 h-8 border-2 border-border">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role ? user.role.toLowerCase().replace('_', ' ') : "member"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-card border border-border shadow-[var(--shadow-medium)] p-2"
          >
            <DropdownMenuLabel className="font-semibold text-base py-2 px-3">
              {user.name || "User"}
            </DropdownMenuLabel>
            <p className="text-xs text-muted-foreground px-3 pb-2 break-all">
              {user.email || "No email"}
            </p>
            <DropdownMenuSeparator className="bg-border my-2" />
            <DropdownMenuItem 
              onClick={handleProfileClick}
              className="flex items-center p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-2" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors text-red-600 dark:text-red-400 text-sm font-medium"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}