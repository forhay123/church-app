import React, { useState, useEffect, useCallback } from "react";
import { format, isSunday, isSaturday } from "date-fns";
import {
  CalendarDays,
  Church,
  Briefcase,
  User,
  Clock,
  Crown,
} from "lucide-react";
import {
  fetchMemberAttendanceByDate,
  fetchUserProfile,
  fetchChurches,
  fetchDepartmentsNames,
} from "../utils/api";
import MessageDashboardCard from "../components/MessageDashboardCard";
import RoleImageDashboardCard from "../components/RoleImageDashboardCard";

const scriptures = [
  "Proverbs 3:5-6 - Trust in the Lord with all your heart and lean not on your own understanding",
  "Philippians 4:6-7 - Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God",
  "Jeremiah 29:11 - 'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, to give you hope and a future'",
  "Psalm 23:1 - The Lord is my shepherd, I lack nothing",
  "Matthew 6:33 - But seek first his kingdom and his righteousness, and all these things will be given to you as well",
  "John 14:6 - Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me'",
  "Psalm 119:105 - Your word is a lamp for my feet, a light on my path",
];

export default function PersonalDashboard() {
  const [attendanceStatus, setAttendanceStatus] = useState("loading");
  const [userDetails, setUserDetails] = useState(null);
  const [churches, setChurches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [scripture, setScripture] = useState("");
  const [onDuty, setOnDuty] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [profile, churchesData, departmentsData] = await Promise.all([
        fetchUserProfile(),
        fetchChurches(),
        fetchDepartmentsNames(),
      ]);

      setUserDetails(profile);
      setChurches(
        Array.isArray(churchesData) ? churchesData : churchesData?.data || []
      );
      setDepartments(
        Array.isArray(departmentsData)
          ? departmentsData
          : departmentsData?.data || []
      );

      const today = new Date();
      const dateStr = format(today, "yyyy-MM-dd");
      const attendanceData = await fetchMemberAttendanceByDate(dateStr);

      const isPresent =
        Array.isArray(attendanceData) &&
        attendanceData.some((a) => a.status === "PRESENT");
      const dutyFlag =
        Array.isArray(attendanceData) &&
        attendanceData.some((a) => a.on_duty === true);

      setOnDuty(dutyFlag);

      // Service Day = Sunday OR Saturday
      const isServiceDay = isSunday(today) || isSaturday(today);
      const now = today.getHours() * 60 + today.getMinutes();
      const serviceStartTime = 7 * 60; // 7:00 AM
      const serviceEndTime = 11 * 60 + 30; // 11:30 AM

      if (isServiceDay) {
        if (now < serviceStartTime) {
          setDashboardMessage(
            "Service starts at 7:00am today. Get ready, we'd love to see you in church!"
          );
          setAttendanceStatus("absent");
        } else if (now >= serviceStartTime && now <= serviceEndTime) {
          if (isPresent) {
            setDashboardMessage(
              `Thank you for being in service today! ${
                dutyFlag ? "You are also on duty." : ""
              }`
            );
            setAttendanceStatus("present");
          } else {
            setDashboardMessage(
              "Service is ongoing. Don't forget to mark your attendance so we know you're with us!"
            );
            setAttendanceStatus("absent");
          }
        } else {
          if (isPresent) {
            setDashboardMessage(
              `Praise God! Thank you for being part of today's service. ${
                dutyFlag ? "We appreciate your duty service too." : ""
              }`
            );
            setAttendanceStatus("present");
          } else {
            setDashboardMessage(
              "We missed you in church today. We look forward to seeing you next service!"
            );
            setAttendanceStatus("absent");
          }
        }
      } else {
        const randomScripture =
          scriptures[Math.floor(Math.random() * scriptures.length)];
        setScripture(randomScripture);
        setDashboardMessage(
          "Have a blessed and productive day ahead! Here's today's word for you:"
        );
        setAttendanceStatus("other_day");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setAttendanceStatus("error");
      setDashboardMessage(
        "There was an error loading your dashboard. Please try again later."
      );
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getChurchName = (id) => {
    const church = churches.find((c) => c.id === id);
    return church ? church.name : "N/A";
  };

  const getDepartmentName = (id) => {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "N/A";
  };

  const getStatusBadge = () => {
    switch (attendanceStatus) {
      case "present":
        return (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            Present Today
          </div>
        );
      case "absent":
        return (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-2" />
            Service Time
          </div>
        );
      default:
        return null;
    }
  };

  const renderDashboardMessage = () => {
    switch (attendanceStatus) {
      case "loading":
        return (
          <div className="dashboard-card p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded-lg w-3/4"></div>
              <div className="h-4 bg-muted rounded-lg w-1/2"></div>
            </div>
          </div>
        );
      case "present":
        return (
          <div className="dashboard-card status-present p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="dashboard-card-icon bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <Church className="w-6 h-6" />
              </div>
              {getStatusBadge()}
            </div>
            <p className="text-card-foreground text-lg leading-relaxed font-medium">
              {dashboardMessage}
            </p>
          </div>
        );
      case "absent":
        return (
          <div className="dashboard-card status-absent p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="dashboard-card-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              {getStatusBadge()}
            </div>
            <p className="text-card-foreground text-lg leading-relaxed font-medium">
              {dashboardMessage}
            </p>
          </div>
        );
      case "other_day":
        return (
          <div className="dashboard-card status-neutral p-8">
            <div className="dashboard-card-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-6">
              <Crown className="w-6 h-6" />
            </div>
            <p className="text-card-foreground text-lg leading-relaxed font-medium mb-6">
              {dashboardMessage}
            </p>
            <blockquote className="border-l-4 border-primary/40 pl-6 py-2 italic text-muted-foreground bg-primary/5 rounded-r-lg">
              {scripture}
            </blockquote>
          </div>
        );
      case "error":
        return (
          <div className="dashboard-card p-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">{dashboardMessage}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container-responsive py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold gradient-text">
                Welcome{" "}
                {userDetails?.name
                  ? `, ${userDetails.name.split(" ")[0]}`
                  : ""}
              </h1>
              {userDetails && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Church className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{getChurchName(userDetails.church_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{getDepartmentName(userDetails.department_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium capitalize">{userDetails.role}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="dashboard-card p-6 text-center lg:text-right min-w-0 lg:min-w-[200px]">
              <p className="text-sm text-muted-foreground mb-1">Today</p>
              <p className="font-bold text-xl text-foreground">
                {format(new Date(), "EEEE")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
        
        {/* Dashboard Message */}
        <div className="mb-12">
          {renderDashboardMessage()}
        </div>
        
        {/* Messages Section */}
        <div className="mb-12">
          <MessageDashboardCard />
        </div>

        {/* Role-based Images */}
        {userDetails?.role && (
          <div className="mb-12">
            <RoleImageDashboardCard role={userDetails.role} />
          </div>
        )}
      </div>
    </div>
  );
}