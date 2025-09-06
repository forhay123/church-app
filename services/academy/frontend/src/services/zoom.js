// services/zoom.js
import { fetchWithAuth } from './utils';

export const fetchZoomMeetings = async () => {
  return await fetchWithAuth('/zoom-classes/meetings/');
};

export const createZoomMeeting = async (meetingData) => {
  // ✅ Do NOT send host_id — backend will assign from logged-in user
  return await fetchWithAuth('/zoom-classes/meetings/', 'POST', {
    meeting_url: meetingData.meeting_url,
    topic: meetingData.topic,
    start_time: meetingData.start_time,
    duration_minutes: meetingData.duration_minutes,
    timetable_id: meetingData.timetable_id || null,
  });
};

export const deleteZoomMeeting = async (meetingId) => {
  return await fetchWithAuth(`/zoom-classes/meetings/${meetingId}`, 'DELETE');
};
