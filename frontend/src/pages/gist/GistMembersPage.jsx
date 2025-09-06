import React, { useEffect, useState } from "react";
import { fetchCenterMembers, fetchGistCenterByLeader, fetchChurches, fetchDepartments } from "../../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function GistMembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gistCenter, setGistCenter] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchGistData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user || user.role.toUpperCase() !== "GIST_HEAD") {
          setError("Access Denied: You are not a Gist leader.");
          setLoading(false);
          return;
        }

        // Fetch the Gist Center details for the current leader
        const centerData = await fetchGistCenterByLeader(user.id);
        setGistCenter(centerData);

        // Fetch the members of that specific Gist Center
        const membersData = await fetchCenterMembers(centerData.id);

        // Fetch churches and departments concurrently
        const [churches, departments] = await Promise.all([
          fetchChurches(),
          fetchDepartments(),
        ]);

        // Create lookup maps for churches and departments
        const churchMap = churches.reduce((acc, c) => {
          acc[c.id] = c.name;
          return acc;
        }, {});

        const departmentMap = departments.reduce((acc, d) => {
          acc[d.id] = d.name;
          return acc;
        }, {});

        // Enrich the members' data with church and department names
        const enrichedMembers = membersData.map((member) => ({
          ...member,
          church_name: churchMap[member.church_id] || "N/A",
          department_name: departmentMap[member.department_id] || "N/A",
        }));

        setMembers(enrichedMembers);
      } catch (err) {
        console.error("Error fetching Gist data:", err);
        setError(err.response?.data?.detail || err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchGistData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading members...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {gistCenter ? `Members of ${gistCenter.name}` : "Gist Center Members"}
      </h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>{member.church_name || "N/A"}</TableCell>
                      <TableCell>{member.department_name || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No members found for this Gist Center.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GistMembersPage;