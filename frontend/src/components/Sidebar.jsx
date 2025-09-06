import React from "react";
import { NavLink } from "react-router-dom";
import {
  X,
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  QrCode,
  ClipboardCheck,
  Key,
  Image,
  MessageSquare,
  Building,
  UserCheck,
  Users as UsersGroupIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar({ isOpen, onClose }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.role) return null;

  const getNavLinks = () => {
    const baseLinks = [];

    switch (user.role.toUpperCase()) {
      case "ADMIN":
        baseLinks.push(
          { name: "Dashboard", to: "/admin", icon: Home },
          { name: "Attendance", to: "/admin/attendance", icon: Calendar },
          { name: "Users", to: "/admin/users", icon: Users },
          { name: "Church Setup", to: "/admin/church", icon: Building },
          { name: "Role Permissions", to: "/admin/permissions", icon: Settings },
          { name: "Generate Attendance QR", to: "/admin/generate-attendance-qr", icon: QrCode },
          { name: "Duty Marking", to: "/admin/duty-marking", icon: ClipboardCheck },
          { name: "Access Requests", to: "/admin/access-requests", icon: Key },
          { name: "Upload Picture", to: "/admin/upload-picture", icon: Image },

          // Finance links
          { name: "Finance Records", to: "/finance/list", icon: BarChart3 },
          { name: "Financial Analysis", to: "/finance/summary", icon: BarChart3 },

          // Gist management
          { name: "Gist Centers", to: "/admin/gist/centers", icon: Building },
          { name: "Assign Gist Members", to: "/admin/gist/assign", icon: UserCheck },
          { name: "Users by Gist", to: "/admin/gist/users", icon: UsersGroupIcon }
        );
        break;

      case "LEAD_PASTOR":
        baseLinks.push(
          { name: "Dashboard", to: "/lead-pastor", icon: Home },
          { name: "Global Members", to: "/attendance/lead-pastor/members", icon: Users },
          { name: "Global Attendance", to: "/attendance/lead-pastor/all-departments", icon: Calendar },

          // Finance links
          { name: "Finance Records", to: "/finance/list", icon: BarChart3 },
          { name: "Financial Analysis", to: "/finance/summary", icon: BarChart3 }
        );
        break;

      case "HEAD_A":
        baseLinks.push(
          { name: "Dashboard", to: "/finance", icon: Home },
          { name: "Create Finance Record", to: "/finance/create", icon: ClipboardCheck },
          { name: "My Finance Records", to: "/finance/list", icon: BarChart3 },
          { name: "Financial Analysis", to: "/finance/summary", icon: BarChart3 }
        );
        break;

      // Other roles
      case "EXECUTIVE":
        baseLinks.push(
          { name: "Dashboard", to: "/executive", icon: Home },
          { name: "Reports", to: "/executive/reports", icon: BarChart3 }
        );
        break;

      case "PASTOR":
        baseLinks.push(
          { name: "Dashboard", to: "/pastor", icon: Home },
          { name: "Congregation", to: "/pastor/congregation", icon: Users },
          { name: "Members Attendance", to: "/pastor/attendance", icon: Calendar }
        );
        break;

      case "DEPARTMENT_LEADER":
        baseLinks.push(
          { name: "Dashboard", to: "/department-leader", icon: Home },
          { name: "Members", to: "/department-leader/members", icon: Users },
          { name: "Members Attendance", to: "/department-leader/members-attendance", icon: Calendar },
          { name: "Duty Marking", to: "/department-leader/duty-marking", icon: ClipboardCheck }
        );
        break;

      case "GIST_HEAD":
        baseLinks.push(
          { name: "Dashboard", to: "/gist", icon: Home },
          { name: "My Gist Members", to: "/gist/members", icon: Users },
          { name: "Gist Attendance", to: "/gist/attendance", icon: Calendar },
          { name: "Gist Attendance History", to: "/gist/attendance/history", icon: Calendar },
          { name: "Duty Marking", to: "/gist/duty-marking", icon: ClipboardCheck }
        );
        break;

      default:
        baseLinks.push(
          { name: "Dashboard", to: "/member", icon: Home },
          { name: "My Gist Dashboard", to: "/gist/attendance/my", icon: Home }
        );
        break;
    }

    // Shared links
    baseLinks.push(
      { name: "Messages", to: "/messages", icon: MessageSquare },
      { name: "My Attendance", to: "/member/attendance", icon: Calendar },
      { name: "My Profile", to: "/profile", icon: Settings }
    );

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">LOGIC</h2>
                <p className="text-sm text-muted-foreground capitalize font-medium">
                  {user.role?.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6">
            <div className="dashboard-card p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <h3 className="font-semibold text-foreground text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground break-all">{user.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4">
            <nav className="space-y-2 pb-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`
                  }
                  onClick={onClose}
                >
                  <link.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{link.name}</span>
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-4 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 cursor-not-allowed opacity-60">
              <Settings className="w-5 h-5 shrink-0" />
              <span className="font-medium truncate">Settings</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-md">Soon</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  );
}
