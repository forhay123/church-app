import React, { useEffect, useState } from "react";
import { fetchZoomMeetings, deleteZoomMeeting } from "../../services/zoom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Video } from "lucide-react";
import { toast } from "react-toastify";

const AdminZoomClassesPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await fetchZoomMeetings();
      setMeetings(data || []);
    } catch (err) {
      toast.error("Failed to load Zoom meetings.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await deleteZoomMeeting(id);
      toast.success("Meeting deleted.");
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      toast.error("Failed to delete meeting.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">All Zoom Classes</h1>

      {meetings.length === 0 ? (
        <p className="text-gray-500">No Zoom classes created yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{meeting.topic}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(meeting.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Start:</span>{" "}
                  {new Date(meeting.start_time).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Duration:</span>{" "}
                  {meeting.duration_minutes} mins
                </p>
                {meeting.host && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Teacher:</span>{" "}
                    {meeting.host.full_name || meeting.host.username}
                  </p>
                )}
                {meeting.timetable_slot && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Timetable:</span>{" "}
                    {meeting.timetable_slot.day} (Period {meeting.timetable_slot.period})
                  </p>
                )}

                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full mt-2">
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminZoomClassesPage;
