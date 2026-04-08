import api from './courses';
import { CreateCoursePayload } from '../types/createCourse';

// ─── Create a new course (POST /courses) ─────────────────────────────────────
export const createCourse = (data: CreateCoursePayload) =>
  api.post<{ id: string }>('/courses', data);

// ─── Upload a lesson video (POST /lessons/course/:courseId) ──────────────────
export const createLesson = (courseId: string, formData: FormData) =>
  api.post(`/lessons/course/${courseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Create a quiz for a lesson (POST /quizzes/lesson/:lessonId) ─────────────
export const createQuiz = (lessonId: string, data: {
  title: string;
  questions: { question: string; answers: string[]; correctIndex: number }[];
}) => api.post(`/quizzes/lesson/${lessonId}`, data);
