import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface ResendRequest {
  email: string;
}

export const register = (data: RegisterRequest) =>
  api.post('/auth/register', data);

export const login = (data: LoginRequest) =>
  api.post('/auth/login', data);

export const verify = (data: VerifyRequest) =>
  api.post('/auth/verify', data);

export const resendCode = (data: ResendRequest) =>
  api.post('/auth/resend', data);

export const isAuthenticated = (): boolean => !!localStorage.getItem('token');

export const logout = (): void => {
  localStorage.removeItem('token');
};

export default api;
