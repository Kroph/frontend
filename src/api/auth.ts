import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export const register = (data: RegisterRequest) =>
  api.post('/auth/register', data);

export const login = (data: LoginRequest) =>
  api.post('/auth/login', data);

export const verify = (data: VerifyRequest) =>
  api.post('/auth/verify', data);

export default api;
