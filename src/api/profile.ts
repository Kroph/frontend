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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  courseCount?: number;
  enrolledCount?: number;
  role?: string;
}

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  courseTitle?: string;
  createdAt: string;
}

export interface TeacherApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string;
  yearsOfExperience: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  score?: number;
  aiSummary?: string;
  aiStrengths?: string;
  aiWeaknesses?: string;
  aiRecommendation?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface TeacherApplicationFormData {
  fullName: string;
  email: string;
  specialization: string;
  yearsOfExperience: number;
  resumeFile: File;
}

export const getProfile = () => api.get<UserProfile>('/users/me');
export const getMyReviews = () => api.get<Review[]>('/reviews/me');
export const updateProfile = (data: Partial<UserProfile>) =>
  api.put<UserProfile>('/users/me', data);

export const submitTeacherApplication = (data: TeacherApplicationFormData) => {
  const form = new FormData();
  form.append('fullName', data.fullName);
  form.append('email', data.email);
  form.append('specialization', data.specialization);
  form.append('yearsOfExperience', String(data.yearsOfExperience));
  form.append('resumeFile', data.resumeFile);
  return api.post<TeacherApplication>('/teacher-applications', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMyApplication = () =>
  api.get<TeacherApplication>('/teacher-applications/me');

export default api;
