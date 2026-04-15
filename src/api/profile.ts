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

export const getProfile = () => api.get<UserProfile>('/users/me');
export const getMyReviews = () => api.get<Review[]>('/reviews/me');
export const updateProfile = (data: Partial<UserProfile>) =>
  api.put<UserProfile>('/users/me', data);

export default api;
