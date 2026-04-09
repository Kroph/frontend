import api from './courses';
import { CreateCoursePayload } from '../types/createCourse';

export const createCourse = (data: CreateCoursePayload) =>
  api.post<{ id: string }>('/courses', data);

export const createLesson = (courseId: string, formData: FormData) =>
  api.post(`/lessons/course/${courseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const createQuiz = (lessonId: string, data: {
  title: string;
  questions: { question: string; answers: string[]; correctIndex: number }[];
}) => api.post(`/quizzes/lesson/${lessonId}`, data);
