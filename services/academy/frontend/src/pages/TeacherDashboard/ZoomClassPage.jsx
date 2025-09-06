// C:\Users\User\Desktop\church-app\services\academy\frontend\src\pages\TeacherDashboard\ZoomClassPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import {
  fetchZoomMeetings,
  createZoomMeeting,
  deleteZoomMeeting,
} from '@/services/zoom';
import { fetchTeacherTimetable } from '@/services/timetable';

const ZoomClassPage = () => {
  const { auth, loading: authLoading } = useAuth();
  const user = auth;

  const [meetings, setMeetings] = useState([]);
  const [timetableOptions, setTimetableOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    meeting_url: '',
    topic: '',
    start_time: '',
    duration_minutes: 60,
    timetable_id: '',
  });

  const safeFormat = (dateLike) => {
    try {
      const d = dateLike ? new Date(dateLike) : null;
      if (!d || isNaN(d.getTime())) return 'Invalid date';
      return format(d, 'PPP p');
    } catch {
      return 'Invalid date';
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
      setError('Could not load meetings.');
      toast.error("Could not load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSlots = async () => {
    try {
      const slots = await fetchTeacherTimetable();
      setTimetableOptions(Array.isArray(slots) ? slots : []);
    } catch (err) {
      console.error("❌ Failed to fetch teacher timetable:", err);
      toast.error("Could not load timetable options.");
    }
  };

  useEffect(() => {
    if (!authLoading && user?.token) {
      fetchMeetings();
      fetchTeacherSlots();
    }
  }, [user, authLoading]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!user?.username) {
      toast.error("You must be logged in to create a meeting.");
      return;
    }
    setIsCreating(true);
    try {
      const payload = {
        meeting_url: newMeeting.meeting_url.trim(),
        topic: newMeeting.topic.trim(),
        start_time: newMeeting.start_time ? new Date(newMeeting.start_time).toISOString() : null,
        duration_minutes: Number(newMeeting.duration_minutes) || 60,
        timetable_id: newMeeting.timetable_id ? Number(newMeeting.timetable_id) : null,
      };

      await createZoomMeeting(payload);
      toast.success('Meeting created successfully!');
      setNewMeeting({
        meeting_url: '',
        topic: '',
        start_time: '',
        duration_minutes: 60,
        timetable_id: '',
      });
      setIsDialogOpen(false);
      fetchMeetings();
    } catch (error) {
      toast.error(`Error creating meeting: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (meetingId) => {
    if (!meetingId) return;
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      setIsDeleting(true);
      try {
        await deleteZoomMeeting(meetingId);
        toast.success('Meeting deleted successfully!');
        fetchMeetings();
      } catch (error) {
        toast.error(`Error deleting meeting: ${error?.message || 'Unknown error'}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

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
        You must be logged in to access Zoom classes.
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

  const role = user?.role;
  const isAuthorized = role === 'admin' || role === 'teacher';

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
          <CardTitle>Upcoming Zoom Meetings</CardTitle>
          {isAuthorized && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>Create New Meeting</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Zoom Meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMeeting} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Algebra - Linear Equations"
                      value={newMeeting.topic}
                      onChange={(e) => setNewMeeting({ ...newMeeting, topic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="meeting_url">Meeting URL</Label>
                    <Input
                      id="meeting_url"
                      placeholder="https://zoom.us/j/your-meeting-id"
                      value={newMeeting.meeting_url}
                      onChange={(e) => setNewMeeting({ ...newMeeting, meeting_url: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newMeeting.start_time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      min="15"
                      max="480"
                      value={newMeeting.duration_minutes}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, duration_minutes: Number(e.target.value) || 60 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="timetable_id">Select Timetable Slot</Label>
                    <select
                      id="timetable_id"
                      className="w-full border rounded p-2"
                      value={newMeeting.timetable_id}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, timetable_id: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Select a timetable slot --</option>
                      {timetableOptions.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {`${slot.day} Period ${slot.period} (${slot.start_time} - ${slot.end_time})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? 'Creating...' : 'Create Meeting'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <p className="text-muted-foreground">No upcoming meetings scheduled.</p>
            ) : (
              meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">{meeting.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      Host: {meeting?.host?.full_name || 'N/A'}
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
                  {(role === 'admin' || meeting.host_id === user?.id) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(meeting.id)}
                      disabled={isDeleting}
                      className="mt-2 md:mt-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZoomClassPage;
