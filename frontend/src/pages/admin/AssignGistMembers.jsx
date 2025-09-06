import React, { useEffect, useState } from "react";
import {
  fetchGistCenters,
  assignMemberToCenter,
  fetchCenterMembers,
  fetchUserData, // Used for unassigned users
  fetchChurches, // ✅ Fetch churches
  fetchDepartments, // ✅ Fetch departments
} from "@utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AssignGistMembers() {
  const [centers, setCenters] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [lookupData, setLookupData] = useState({
    churchMap: {},
    departmentMap: {},
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ New function to load initial data, including lookups
  async function loadInitialData() {
    try {
      const [cData, userData, churchesData, departmentsData] = await Promise.all([
        fetchGistCenters(),
        fetchUserData(),
        fetchChurches(),
        fetchDepartments(),
      ]);

      setCenters(cData);
      setUsers(userData.enrichedUsers);

      // Create lookup maps and store in state
      const churchMap = churchesData.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
      const departmentMap = departmentsData.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {});
      setLookupData({ churchMap, departmentMap });
    } catch (err) {
      console.error("Error loading data", err);
    }
  }

  async function loadMembers(centerId) {
    if (!centerId) {
      setMembers([]);
      return;
    }
    try {
      const data = await fetchCenterMembers(centerId);
      // ✅ Enrich members data with church and department names
      const enrichedMembers = data.map((member) => ({
        ...member,
        church_name: lookupData.churchMap[member.church_id] || "N/A",
        department_name: lookupData.departmentMap[member.department_id] || "N/A",
      }));
      setMembers(enrichedMembers);
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  }

  function handleUserSelection(userId) {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  }

  async function handleAssign() {
    if (!selectedCenter || selectedUsers.length === 0) return;

    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          assignMemberToCenter(selectedCenter, userId)
        )
      );
      await loadMembers(selectedCenter);
      setSelectedUsers([]); // clear selection
      const remainingUsers = users.filter((u) => !selectedUsers.includes(u.id));
      setUsers(remainingUsers); // remove assigned users from dropdown
    } catch (err) {
      alert("Assignment failed: " + err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Assign Members to Gist Centers</h1>

      {/* Select Center */}
      <div className="space-y-2">
        <label className="font-semibold">Select Center</label>
        <Select
          value={selectedCenter || ""}
          onValueChange={(val) => {
            setSelectedCenter(val);
            loadMembers(val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a Gist Center" />
          </SelectTrigger>
          <SelectContent>
            {centers.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Multi-select Users */}
      <div className="space-y-2">
        <label className="font-semibold">Select Users</label>
        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
          {users.map((u) => (
            <div key={u.id} className="flex items-center space-x-2 py-1">
              <Checkbox
                id={`user-${u.id}`}
                checked={selectedUsers.includes(u.id)}
                onCheckedChange={() => handleUserSelection(u.id)}
                // ✅ MANUAL COLOR OVERRIDE:
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
              />
              <label htmlFor={`user-${u.id}`} className="text-sm font-medium">
                {u.name} ({u.church_name}, {u.department_name})
              </label>
            </div>
          ))}
        </div>
        <Button onClick={handleAssign} className="mt-2">
          Assign Selected Users
        </Button>
      </div>

      {/* Current Members */}
      {selectedCenter && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Members in this Center</h2>
            <ul className="list-disc pl-5">
              {members.map((m) => (
                <li key={m.id}>
                  {/* ✅ Corrected: Display church and department names */}
                  {m.name} ({m.church_name}, {m.department_name})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}