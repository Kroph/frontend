import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  category: string;
  level: string;
  thumbnail?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  price?: number;
  rating?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  duration?: number;
  videoUrl?: string;
  videoFileName?: string;
  lectureText?: string;
  lecturePdfUrl?: string;
  published: boolean;
}

export const getCourses = () => api.get<Course[]>('/courses');
export const getCourseById = (id: string) => api.get<Course>(`/courses/${id}`);
export const getLessonsByCourse = (courseId: string) =>
  api.get<Lesson[]>(`/lessons/course/${courseId}`);

export default api;
