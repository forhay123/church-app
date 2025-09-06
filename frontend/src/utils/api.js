// src/utils/api.js
import apiClient from "./apiClient";
import { format } from "date-fns";


// Use this new variable to construct the full image URL
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL;

// ---------------------- AUTH ----------------------


// 🟢 Login (updated)
export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  // 1️⃣ Request token
  const res = await fetch(`${apiClient.defaults.baseURL}/auth/token`, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Login failed");
  }

  const data = await res.json();

  // 2️⃣ Save token immediately
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("user_id", data.user_id);

  // 3️⃣ Fetch full user profile
  const profileRes = await apiClient.get("/users/me");
  const profile = profileRes.data;

  // 4️⃣ Save full profile to localStorage
  localStorage.setItem("user", JSON.stringify(profile));

  return { tokenData: data, profile };
}

// Fetch current user profile
export async function fetchUserProfile() {
  const res = await apiClient.get("/users/me");
  return res.data;
}

// ---------------------- ATTENDANCE ----------------------

// Fetch attendance by date (for admin)
export async function fetchAttendanceByDate(dateStr) {
  const res = await apiClient.get("/attendance/", { params: { date: dateStr } });
  return res.data;
}

// Submit attendance (bulk)
export async function submitAttendance(payload) {
  const res = await apiClient.post("/attendance/", payload);
  return res.data;
}

// ---------------------- Member Attendance ----------------------

// Fetch ALL attendance records for the logged-in member
export async function fetchMemberAttendance() {
  const res = await apiClient.get(`/member/attendance/`);
  return res.data;
}

// Fetch attendance records for the logged-in member filtered by date
export async function fetchMemberAttendanceByDate(dateStr) {
  const res = await apiClient.get(`/member/attendance/`, { params: { date: dateStr } });
  return res.data;
}

// ---------------------- USERS & LOOKUPS ----------------------

// Fetch all users
export async function fetchUsers() {
  const res = await apiClient.get("/users/");
  return res.data;
}

// Fetch churches
export async function fetchChurches() {
  const res = await apiClient.get("/users/churches");
  return res.data;
}

// Fetch departments
export async function fetchDepartments() {
  const res = await apiClient.get("/users/departments");
  return res.data;
}

// Fetch department names
export async function fetchDepartmentsNames() {
  const res = await apiClient.get("/users/departments");
  return res.data;
}

// ---------------------- ORG / REGISTRATION ----------------------

// Add new church
export async function addChurch(name, location) {
  const res = await apiClient.post("/org/churches", { name, location });
  return res.data;
}

// Add new department
export async function addDepartment(name, church_id) {
  const res = await apiClient.post("/org/departments", { name, church_id });
  return res.data;
}


// Fetch roles
export async function fetchRoles() {
  const res = await apiClient.get("/lookup/roles");
  return res.data;
}

// ✅ Update user (excluding photo_url so no giant base64 string goes in)
export async function updateUser(userId, payload) {
  const { photo_url, ...rest } = payload; // ⛔ strip out base64/photo field
  const res = await apiClient.put(`/users/${userId}`, rest);
  return res.data;
}

// ✅ Upload user photo (new endpoint)
export async function uploadUserPhoto(userId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post(`/users/${userId}/upload-photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data; // returns { photo_url: "/uploads/users/xx.jpg" }
}

export function getFullImageUrl(relativePath) {
  if (!relativePath) {
    return "/placeholder.png";
  }

  // If the URL is already an absolute path, use it as is.
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  // Correctly combine the base URL with the relative path.
  // This accounts for whether the relativePath starts with a slash or not.
  const separator = relativePath.startsWith('/') ? '' : '/';
  
  return `${UPLOADS_BASE_URL}${separator}${relativePath}`;
}

// ---------------------- ORG / REGISTRATION ----------------------

// Fetch churches for registration
export async function fetchChurchesForRegistration() {
  const res = await apiClient.get("/org/churches");
  return res.data;
}

// Fetch departments for a specific church
export async function fetchDepartmentsForChurch(churchId) {
  const res = await apiClient.get(`/org/churches/${churchId}/departments`);
  return res.data;
}

// ---------------------- DEPARTMENT MEMBERS ----------------------

// 🆕 This is the new function to fetch members for the logged-in leader.
export async function fetchMyDepartmentMembers() {
  const res = await apiClient.get(`/org/my-department/members`);
  return res.data;
}


export async function fetchDepartmentMembers(dateStr) {
  // The backend uses the authenticated user's department to filter members.
  const res = await apiClient.get(`/attendance/department/members`, {
    params: {
      date: dateStr // ✅ Use the date string passed as an argument.
    }
  });
  return res.data;
}


// ✅ Fixed function with both department and church filtering
export async function fetchAdminAllDepartmentsAttendance(dateStr, departmentId = null, churchId = null) {
  const params = { date: dateStr };
  if (departmentId) {
    params.department_id = departmentId;
  }
  if (churchId) {
    params.church_id = churchId;
  }
  const res = await apiClient.get(`/attendance/admin/all-departments`, {
    params,
  });
  return res.data;
}


// ---------------------- REGISTER USER ----------------------
export async function registerUser(payload) {
  const res = await apiClient.post("/auth/register", payload);
  return res.data;
}

// ---------------------- ATTENDANCE QR ----------------------

// 🟢 Admin: Generate attendance QR/link
export async function generateAttendanceQR() {
  const res = await apiClient.post("/attendance-qr/generate");
  return res.data; // { token, link }
}

// 🟢 Member: Mark attendance using QR/link token
export async function markAttendanceWithToken(token) {
  const res = await apiClient.post(`/attendance-qr/${token}`);
  return res.data; // { detail }
}

// ---------------------- PASTOR ATTENDANCE ----------------------

// 🟢 Fetch all members' attendance for pastor’s church
export async function fetchChurchMembersAttendance() {
  const res = await apiClient.get("/attendance/church/members");
  return res.data;
}

// 🟢 Fetch all members' attendance filtered by date
export async function fetchChurchMembersAttendanceByDate(dateStr) {
  const res = await apiClient.get("/attendance/church/members", {
    params: { date: dateStr },
  });
  return res.data;
}


// ---------------------- LEAD PASTOR ATTENDANCE ----------------------

// 🟢 Fetch all members' attendance for the lead pastor’s church
export async function fetchLeadPastorAttendance() {
  const res = await apiClient.get("/attendance/lead-pastor/members");
  return res.data;
}

// 🟢 Fetch all members' attendance filtered by date
export async function fetchLeadPastorAttendanceByDate(dateStr) {
  const res = await apiClient.get("/attendance/lead-pastor/members", {
    params: { date: dateStr },
  });
  return res.data;
}



// ---------------------- PERMISSIONS ----------------------

// Fetch all permissions (optional: for a given user_id)
export async function fetchPermissions(userId) {
  const res = await apiClient.get("/permissions/", {
    params: userId ? { user_id: userId } : {},
  });
  return res.data;
}

// Grant access
export async function grantPermission(userId, resource) {
  const res = await apiClient.post(`/permissions/grant/${userId}`, { resource });
  return res.data;
}

// Revoke access
export async function revokePermission(userId, resource) {
  const res = await apiClient.post(`/permissions/revoke/${userId}`, { resource });
  return res.data;
}

// Bulk-assign permissions to a user
export async function bulkAssignPermissions(userId, resources) {
  const res = await apiClient.post(`/permissions/bulk-assign/${userId}`, {
    resources,
  });
  return res.data;
}

// ✅ ROLE-BASED PERMISSIONS
export async function fetchRolePermissions(role) {
  const res = await fetch(`/api/permissions/role/${role}`);
  if (!res.ok) throw new Error("Failed to fetch role permissions");
  return res.json();
}

export async function grantRolePermission(role, resource) {
  const res = await fetch(`/api/permissions/grant-role/${role}?resource=${resource}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to grant role permission");
  return res.json();
}

export async function revokeRolePermission(role, resource) {
  const res = await fetch(`/api/permissions/revoke-role/${role}?resource=${resource}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to revoke role permission");
  return res.json();
}


// ---------------------- ROLE → ROLE PERMISSIONS ----------------------

// Fetch which roles a given sender role can send to
export async function fetchRoleTargets(senderRole) {
  const res = await apiClient.get(`/role-permissions/${senderRole}`);
  return res.data;
}

// Grant sender_role → target_role access
export async function grantRoleToRole(senderRole, targetRole) {
  const res = await apiClient.post(`/role-permissions/`, {
    sender_role: senderRole,
    target_role: targetRole,
  });
  return res.data;
}

// Revoke sender_role → target_role access
export async function revokeRoleToRole(senderRole, targetRole) {
  const res = await apiClient.delete(`/role-permissions/${senderRole}/${targetRole}`);
  return res.data;
}


// ---------------------- MESSAGES ----------------------

// ✅ Fetch list of available content types
export async function getContentTypes() {
  const res = await apiClient.get("/messages/content-types");
  return res.data;
}

export async function addMessage(formData) {
  const res = await apiClient.post("/messages/send", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchInbox() {
  const res = await apiClient.get("/messages/inbox");
  return res.data;
}

export async function respondToMessage(messageId, responseText) {
  if (responseText === "ACKNOWLEDGED") {
    const res = await apiClient.post(`/messages/${messageId}/acknowledge`);
    return res.data;
  } else {
    // For poll responses
    const formData = new FormData();
    formData.append("text", responseText);
    const res = await apiClient.post(`/messages/${messageId}/respond`, formData);
    return res.data;
  }
}


// ---------------------- PORTAL UPLOADS ----------------------

// 🆕 Upload portal picture/video/link
export async function uploadPortalItem(formData) {
  const res = await apiClient.post("/portal/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// 🆕 Fetch all portal uploads (optionally filter by church/department)
export async function fetchPortalUploads({ churchId, departmentId } = {}) {
  const params = {};
  if (churchId) params.church_id = churchId;
  if (departmentId) params.department_id = departmentId;

  const res = await apiClient.get("/portal/list", { params });
  return res.data;
}

// 🆕 Delete a portal upload
export async function deletePortalUpload(uploadId) {
  const res = await apiClient.delete(`/portal/${uploadId}`);
  return res.data;
}




// 🆕 NEW: Fetch roles
export async function getRoles() {
    const res = await apiClient.get("/lookup/roles");
    return res.data;
}

export async function fetchUsersByRole(roleName) {
  const res = await apiClient.get(`/users/by-role/${roleName}`);
  return res.data;
}


export const requestAccessCode = (email, pageRoute) => {
  return apiClient.post('/access/request', { email, page_route: pageRoute });
};

export const verifyAccessCode = (email, code, pageRoute) => {
  return apiClient.post('/access/verify', { email, code, page_route: pageRoute });
};

export const getPendingAccessCodes = () => {
  // This will require an Authorization header with the admin's JWT token
  return apiClient.get('/access/pending');
};

// ---------------------- GIST CENTERS ----------------------

// Fetch all gist centers
export async function fetchGistCenters() {
  const res = await apiClient.get("/gist/centers");
  return res.data;
}

// Create a new gist center
export async function addGistCenter(payload) {
  const res = await apiClient.post("/gist/centers", payload);
  return res.data;
}

// Assign a member to a gist center
export async function assignMemberToCenter(centerId, userId) {
  const res = await apiClient.post(`/gist/centers/${centerId}/assign/${userId}`);
  return res.data;
}

// List all members in a gist center
export async function fetchCenterMembers(centerId) {
  const res = await apiClient.get(`/gist/centers/${centerId}/members`);
  return res.data;
}


// Fetch users with filters (only unassigned for assignment)
export async function fetchGistUsers({ onlyUnassigned = false } = {}) {
  const params = new URLSearchParams();
  if (onlyUnassigned) params.append("only_unassigned", true);
  const res = await apiClient.get(`/gist/users?${params.toString()}`);
  return res.data;
}

// ✅ Fetch gist center for the currently logged-in leader
export async function fetchGistCenterByLeader() {
  const res = await apiClient.get("/gist/center/by-leader");
  return res.data;
}

// ✅ NEW: Take attendance for a Gist member
export async function takeGistAttendance(payload) {
  const res = await apiClient.post("/gist/attendance", payload);
  return res.data;
}

export async function fetchMyGistAttendance() {
  console.log("Calling /gist/attendance/my");
  const res = await apiClient.get("/gist/attendance/my");
  console.log("Response:", res.data);
  return res.data;
}


// ✅ NEW: Fetch a single gist center by ID
export async function fetchGistCenter(centerId) {
  const res = await apiClient.get(`/gist/centers/${centerId}`);
  return res.data;
}

// ✅ NEW: Fetch all attendance records for a given Gist Center
export async function fetchGistAttendanceHistory(gistCenterId) {
  const res = await apiClient.get(`/gist/attendance/history/${gistCenterId}`);
  return res.data;
}


// ✅ Remove attendance for a Gist member (unmark present)
export async function removeGistAttendance(payload) {
  const { gist_center_id, user_id } = payload;
  const res = await apiClient.delete(
    `/gist/attendance?gist_center_id=${gist_center_id}&user_id=${user_id}`
  );
  return res.data;
}



// ✅ NEW: Combined fetch for all data required for the UI
export async function fetchUserData() {
  // Remove roles from the Promise.all
  const [users, churches, departments] = await Promise.all([
    fetchGistUsers({ onlyUnassigned: true }),
    fetchChurches(),
    fetchDepartments(),
  ]);

  // Create a quick lookup map for each data type
  const churchMap = churches.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const departmentMap = departments.reduce((acc, d) => {
    acc[d.id] = d.name;
    return acc;
  }, {});

  // Map over users and add the full names
  const enrichedUsers = users.map((user) => ({
    ...user,
    church_name: churchMap[user.church_id] || "N/A",
    department_name: departmentMap[user.department_id] || "N/A"
  }));

  // Remove roles from the return object
  return { enrichedUsers, churches, departments };
}



// ---------------------- FINANCES ----------------------

// Create finance (HEAD_A only)
export async function createFinance(payload) {
  const res = await apiClient.post("/finances/", payload);
  return res.data;
}

// Fetch all finances (ADMIN, LEAD_PASTOR get all; HEAD_A gets their own church)
export async function fetchFinances(filters = {}) {
  const params = new URLSearchParams();
  if (filters.date) {
    params.append('date', filters.date);
  }
  if (filters.churchId) {
    params.append('church_id', filters.churchId);
  }
  
  const res = await apiClient.get("/finances/", { params });
  return res.data;
}

// Fetch a single finance record
export async function fetchFinance(financeId) {
  const res = await apiClient.get(`/finances/${financeId}`);
  return res.data;
}

// Update a finance record (HEAD_A only, if not confirmed)
export async function updateFinance(financeId, payload) {
  const res = await apiClient.put(`/finances/${financeId}`, payload);
  return res.data;
}

// Delete a finance record (HEAD_A only, if not confirmed)
export async function deleteFinance(financeId) {
  const res = await apiClient.delete(`/finances/${financeId}`);
  return res.data;
}

// Confirm a finance record (ADMIN only)
export async function confirmFinance(financeId) {
  const res = await apiClient.post(`/finances/${financeId}/confirm`);
  return res.data;
}



export async function fetchFinanceSummary(filters = {}) {
  const params = new URLSearchParams();
  // Check for a single date parameter from the frontend
  if (filters.date) {
    // Send the single date to the backend as both start_date and end_date
    // This tells the backend to look for records on that specific day
    params.append('start_date', filters.date);
    params.append('end_date', filters.date);
  }
  if (filters.churchId) {
    params.append('church_id', filters.churchId);
  }

  const res = await apiClient.get("/finances/summary", { params });
  return res.data;
}