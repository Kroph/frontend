import api from './index';
import type { Course } from './courses';

export interface CreateCourseFields {
  title: string;
  description: string;
  category: string;
  level?: string;
  free?: boolean;
  price?: number;
  thumbnailFile?: File | null;
}

export const createCourse = (data: CreateCourseFields) => {
  const form = new FormData();
  form.append('title', data.title);
  form.append('description', data.description);
  form.append('category', data.category);
  if (data.level) form.append('level', data.level);
  if (data.free !== undefined) form.append('free', String(data.free));
  if (data.price !== undefined) form.append('price', String(data.price));
  if (data.thumbnailFile) form.append('thumbnailFile', data.thumbnailFile);

  return api.post<Course>('/courses', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const createLesson = (courseId: string, formData: FormData) =>
  api.post(`/lessons/course/${courseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export interface CreateQuizData {
  title: string;
  questions: {
    question: string;
    answers: string[];
    correctIndex: number;
  }[];
}

export const createQuiz = (lessonId: string, data: CreateQuizData) =>
  api.post(`/quizzes/lesson/${lessonId}`, data);

export const updateCourse = (courseId: string, data: Partial<CreateCourseFields>) => {
  const form = new FormData();
  if (data.title) form.append('title', data.title);
  if (data.description) form.append('description', data.description);
  if (data.category) form.append('category', data.category);
  if (data.level) form.append('level', data.level);
  if (data.free !== undefined) form.append('free', String(data.free));
  if (data.price !== undefined) form.append('price', String(data.price));
  if (data.thumbnailFile) form.append('thumbnailFile', data.thumbnailFile);

  return api.put<Course>(`/courses/${courseId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
