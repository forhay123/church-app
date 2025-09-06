import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardRedirect from "./pages/DashboardRedirect";
import MessageCenter from "./pages/messages/MessageCenter";
import AccessVerification from "./pages/AccessVerification"; 
import EmailVerification from "./pages/auth/EmailVerification";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";



// Shared layout
import DashboardLayout from "./components/DashboardLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminAttendanceList from "./pages/admin/Attendance/AdminAttendanceList.jsx";
import AdminAttendanceAnalytics from "./pages/admin/Attendance/AdminAttendanceAnalytics.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminChurch from "./pages/admin/AdminChurch.jsx";
import GenerateAttendanceQR from "./pages/admin/GenerateAttendanceQR.jsx";
import RolePermissions from "./pages/admin/RolePermissions.jsx";
import AdminAllDepartmentsAttendancePage from "./pages/admin/Attendance/AdminAllDepartmentsAttendancePage.jsx";
import AccessRequest from "./components/AccessRequest";
import AccessCodeRequests from "./pages/admin/AccessCodeRequests.jsx"; 
import PictureUpload from "./pages/admin/PictureUpload.jsx";
import AdminGistUsersPage from "./pages/admin/AdminGistUsersPage.jsx";
import AssignGistMembers from "./pages/admin/AssignGistMembers.jsx";
import AdminGistCenters from "./pages/admin/AdminGistCenters.jsx";


// ✅ Newly added gist pages
import GistDashboard from "./pages/gist/GistDashboard.jsx";
import GistMembersPage from "./pages/gist/GistMembersPage.jsx"; 
import GistAttendancePage from "./pages/gist/GistAttendancePage.jsx"; 
import GistUserPage from "./pages/gist/GistUserPage.jsx"; 
import GistAttendanceHistoryPage from "./pages/gist/GistAttendanceHistoryPage.jsx"; 



// Lead Pastor pages
import LeadPastorDashboard from "./pages/leadpastor/LeadPastorDashboard.jsx";
import GlobalMember from "./pages/leadpastor/GlobalMember.jsx"; 
import GlobalAttendance from "./pages/leadpastor/GlobalAttendance.jsx"; 



// Finance pages
import FinanceDashboard from "./pages/finance/FinanceDashboard.jsx"; 
import FinanceCreate from "./pages/finance/FinanceCreate.jsx";
import FinanceList from "./pages/finance/FinanceList.jsx";
import FinanceUpdate from "./pages/finance/FinanceUpdate.jsx";
import FinanceSummaryPage from "./pages/finance/FinanceSummaryPage.jsx";


// Executive pages
import ExecutiveDashboard from "./pages/executive/ExecutiveDashboard.jsx";

// Pastor pages
import PastorDashboard from "./pages/pastor/PastorDashboard.jsx";
import PastorAttendancePage from "./pages/pastor/PastorAttendancePage.jsx";

// Department Leader pages
import DepartmentLeaderDashboard from "./pages/departmentLeader/DepartmentLeaderDashboard.jsx";
import DepartmentMembersPage from "./pages/departmentLeader/DepartmentMembersPage";
import DepartmentAttendancePage from "./pages/departmentLeader/Attendance/DepartmentAttendancePage.jsx";
import DepartmentDutyMarkingPage from "./pages/departmentLeader/Attendance/DepartmentDutyMarkingPage.jsx";

// Member pages
import MemberDashboard from "./pages/member/MemberDashboard.jsx";
import MemberAttendancePage from "./pages/member/Attendance/MemberAttendancePage.jsx";
import SelfAttendance from "./pages/member/SelfAttendance.jsx";

// Shared pages
import ProfilePage from "./pages/ProfilePage.jsx";
import { get_current_user_token } from "./utils/auth";
import { jwtDecode } from "jwt-decode";

const ProtectedWithCode = ({ children, pageRoute }) => {
  const navigate = useNavigate();
  const user = get_current_user_token();
  const tempAccessToken = localStorage.getItem("temp_access_token");

  if (user?.role === "ADMIN") {
    return children;
  }
  
  if (tempAccessToken) {
    try {
      const decoded = jwtDecode(tempAccessToken);
      if (decoded.page_route === pageRoute && decoded.exp * 1000 > Date.now()) {
        return children;
      } else {
        localStorage.removeItem("temp_access_token");
      }
    } catch (e) {
      console.error("Invalid temporary token", e);
      localStorage.removeItem("temp_access_token");
    }
  }

  return <AccessRequest pageRoute={pageRoute} />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/verify-access" element={<AccessVerification />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route element={<DashboardLayout />}>
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedWithCode pageRoute="/admin">
            <AdminDashboard />
          </ProtectedWithCode>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedWithCode pageRoute="/admin/attendance">
            <AdminAttendanceList />
          </ProtectedWithCode>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedWithCode pageRoute="/admin/analytics">
            <AdminAttendanceAnalytics />
          </ProtectedWithCode>
        } />
        <Route path="/admin/users" element={
          <ProtectedWithCode pageRoute="/admin/users">
            <AdminUsers />
          </ProtectedWithCode>
        } />
        <Route path="/admin/church" element={
          <ProtectedWithCode pageRoute="/admin/church">
            <AdminChurch />
          </ProtectedWithCode>
        } />
        <Route path="/admin/generate-attendance-qr" element={
          <ProtectedWithCode pageRoute="/admin/generate-attendance-qr">
            <GenerateAttendanceQR />
          </ProtectedWithCode>
        } />
        <Route path="/admin/permissions" element={
          <ProtectedWithCode pageRoute="/admin/permissions">
            <RolePermissions />
          </ProtectedWithCode>
        } />
        <Route path="/admin/access-requests" element={
          <ProtectedWithCode pageRoute="/admin/access-requests">
            <AccessCodeRequests />
          </ProtectedWithCode>
        } />
        <Route 
          path="/admin/duty-marking" 
          element={
            <ProtectedWithCode pageRoute="/admin/duty-marking">
              <AdminAllDepartmentsAttendancePage />
            </ProtectedWithCode>
          } 
        />
        <Route path="/admin/upload-picture" element={
          <ProtectedWithCode pageRoute="/admin/upload-picture">
            <PictureUpload />
          </ProtectedWithCode>
        } />

        {/* ✅ New Gist routes */}
        <Route path="/admin/gist/users" element={
          <ProtectedWithCode pageRoute="/admin/gist/users">
            <AdminGistUsersPage />
          </ProtectedWithCode>
        } />
        <Route path="/admin/gist/assign" element={
          <ProtectedWithCode pageRoute="/admin/gist/assign">
            <AssignGistMembers />
          </ProtectedWithCode>
        } />
        <Route path="/admin/gist/centers" element={
          <ProtectedWithCode pageRoute="/admin/gist/centers">
            <AdminGistCenters />
          </ProtectedWithCode>
        } />
        
        
        {/* Gist routes */}
        <Route path="/gist" element={<GistDashboard />} />
        <Route path="/gist/members" element={<GistMembersPage />} />
        <Route path="/gist/attendance" element={<GistAttendancePage />} />
        <Route path="/gist/attendance/history" element={<GistAttendanceHistoryPage />} />
        <Route path="/gist/attendance/my" element={<GistUserPage />} />|


        
        {/* Lead Pastor routes */}
        <Route path="/lead-pastor" element={<LeadPastorDashboard />} />
        <Route path="/attendance/lead-pastor/members" element={<GlobalMember />} />
        <Route path="/attendance/lead-pastor/all-departments" element={<GlobalAttendance />} />
        <Route path="/finance/update/:id" element={<FinanceUpdate /> } />


        {/* Executive routes */}
        <Route path="/executive" element={<ExecutiveDashboard />} />

      
        {/* Finance routes */}
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/finance/create" element={<FinanceCreate />} />
        <Route path="/finance/list" element={<FinanceList />} />
        <Route path="/finance/summary" element={<FinanceSummaryPage />} />
        
        {/* Pastor routes */}
        <Route path="/pastor" element={<PastorDashboard />} />
        <Route path="/pastor/attendance" element={<PastorAttendancePage />} />
        
        {/* Department Leader routes */}
        <Route path="/department-leader" element={<DepartmentLeaderDashboard />} />
        <Route path="/department-leader/attendance" element={<MemberAttendancePage />} />
        <Route path="/department-leader/members-attendance" element={<DepartmentAttendancePage />} />
        <Route path="/department-leader/members" element={<DepartmentMembersPage />} />
        <Route path="/department-leader/duty-marking" element={<DepartmentDutyMarkingPage />} />
        
        {/* Member routes */}
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/member/attendance" element={<MemberAttendancePage />} />
        
        {/* Shared pages */}
        <Route path="/my-attendance" element={<MemberAttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<MessageCenter />} />
      </Route>
      
      {/* Self-attendance via QR/link */}
      <Route path="/attendance-qr/:token" element={<SelfAttendance />} />
      
      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <p className="text-xl text-muted-foreground">Page not found</p>
            <a href="/" className="inline-block text-primary hover:underline">
              Return to Home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}
