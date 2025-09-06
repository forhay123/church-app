import React, { useEffect, useState } from "react";
import { fetchGistCenters, addGistCenter } from "../../utils/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminGistCenters() {
  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", leader_id: "" });

  useEffect(() => {
    loadCenters();
  }, []);

  async function loadCenters() {
    try {
      const data = await fetchGistCenters();
      setCenters(data);
    } catch (err) {
      console.error("Failed to load gist centers", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        leader_id: form.leader_id ? parseInt(form.leader_id) : null,
      };
      await addGistCenter(payload);
      setForm({ name: "", description: "", leader_id: "" });
      loadCenters();
    } catch (err) {
      alert("Failed to add center: " + err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gist Centers</h1>

      {/* New Center Form */}
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-4 flex-wrap">
          <Input
            placeholder="Center Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            placeholder="Leader ID"
            type="number"
            value={form.leader_id}
            onChange={(e) => setForm({ ...form, leader_id: e.target.value })}
          />
          <Button type="submit">Add Center</Button>
        </form>
      </Card>

      {/* Centers List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {centers.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <h2 className="font-semibold">{c.name}</h2>
              <p className="text-sm text-gray-500">{c.description || "No description"}</p>
              <p className="text-sm">Leader ID: {c.leader_id || "Unassigned"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
