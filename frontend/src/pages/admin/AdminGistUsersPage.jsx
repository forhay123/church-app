import { useEffect, useState } from "react";
import {
  fetchGistUsers,
  fetchGistCenters,
  fetchChurches,
} from "@utils/api";

function AdminGistUsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [gistCenters, setGistCenters] = useState([]);
  const [churches, setChurches] = useState([]);

  const [filters, setFilters] = useState({
    name: "",
    gistCenter: "",
    church: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, gistData, churchData] = await Promise.all([
          fetchGistUsers({ withGistCenter: true }),
          fetchGistCenters(),
          fetchChurches(),
        ]);

        // Map church names
        const churchMap = churchData.reduce(
          (acc, ch) => ({ ...acc, [ch.id]: ch.name }),
          {}
        );

        // Map leaders
        const leaderMap = usersData.reduce(
          (acc, u) => ({ ...acc, [u.id]: u.name }),
          {}
        );

        // Enrich users with church_name
        const enrichedUsers = usersData.map((user) => ({
          ...user,
          church_name: churchMap[user.church_id] || "N/A",
        }));

        // Enrich Gist Centers with leader name
        const enrichedCenters = gistData.map((gc) => ({
          ...gc,
          leader_name: leaderMap[gc.leader_id] || "Unassigned",
        }));

        setUsers(enrichedUsers);
        setFilteredUsers(enrichedUsers);
        setGistCenters(enrichedCenters);
        setChurches(churchData);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let data = [...users];

    if (filters.name) {
      data = data.filter((u) =>
        u.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.gistCenter) {
      data = data.filter(
        (u) => String(u.gist_center_id) === filters.gistCenter
      );
    }

    if (filters.church) {
      data = data.filter((u) => String(u.church_id) === filters.church);
    }

    setFilteredUsers(data);
  }, [filters, users]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Users Assigned to Gist Centers</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="p-2 border rounded-lg w-full"
        />

        <select
          value={filters.gistCenter}
          onChange={(e) =>
            setFilters({ ...filters, gistCenter: e.target.value })
          }
          className="p-2 border rounded-lg w-full"
        >
          <option value="">All Gist Centers</option>
          {gistCenters.map((gc) => (
            <option
              key={gc.id}
              value={gc.id}
              title={gc.description || "No description"}
            >
              {gc.name}
            </option>
          ))}
        </select>

        <select
          value={filters.church}
          onChange={(e) => setFilters({ ...filters, church: e.target.value })}
          className="p-2 border rounded-lg w-full"
        >
          <option value="">All Churches</option>
          {churches.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded-lg">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Gist Center</th>
              <th className="p-2 border">Leader</th> {/* NEW column */}
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Church</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const gc = gistCenters.find((g) => g.id === user.gist_center_id);
                return (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{user.name}</td>
                    <td className="p-2 border">{user.email}</td>
                    <td className="p-2 border">{user.phone || "-"}</td>
                    <td className="p-2 border">{gc?.name || "N/A"}</td>
                    <td className="p-2 border">{gc?.leader_name || "Unassigned"}</td>
                    <td className="p-2 border">{gc?.description || "-"}</td>
                    <td className="p-2 border">{user.church_name || "N/A"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminGistUsersPage;
