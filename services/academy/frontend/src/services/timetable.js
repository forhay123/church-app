// C:\Users\User\Desktop\church-app\services\academy\frontend\src\services\timetable.js

import { fetchWithAuth } from './utils';

// Fetch the timetable for the current logged-in teacher
export const fetchTeacherTimetable = async () => {
    // We'll use the existing /teacher endpoint
    return await fetchWithAuth('/timetable/teacher');
};