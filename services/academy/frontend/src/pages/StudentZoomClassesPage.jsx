import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { fetchZoomMeetings } from "@/services/zoom";
import { format } from "date-fns";

const StudentZoomClassesPage = () => {
  const { auth, loading: authLoading } = useAuth();
  const user = auth;

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeFormat = (dateLike) => {
    try {
      const d = dateLike ? new Date(dateLike) : null;
      if (!d || isNaN(d.getTime())) return "Invalid date";
      return format(d, "PPP p");
    } catch {
      return "Invalid date";
    }
  };

  const fetchMeetings = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchZoomMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Failed to fetch meetings:", err);
      setError("Could not load meetings.");
      toast.error("Could not load meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.token) {
      fetchMeetings();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user?.token) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">
        You must be logged in to view Zoom classes.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error fetching meetings. Please try again later.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Zoom Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground">No Zoom classes scheduled for your subjects.</p>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">{meeting.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      Teacher: {meeting?.host?.full_name || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Time: {safeFormat(meeting?.start_time)} ({meeting?.duration_minutes ?? 0} mins)
                    </p>
                    {meeting?.meeting_url && (
                      <a
                        href={meeting.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentZoomClassesPage;
