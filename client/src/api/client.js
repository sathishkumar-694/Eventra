import { getToken } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;

export async function request(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.errors = data.errors || null;
    err.statusCode = res.status;
    throw err;
  }
  return data;
}
