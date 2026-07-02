import { getToken, setAuth, logout } from '../utils/auth';

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
  
  let res = await fetch(`${API_BASE}${endpoint}`, config);
  let data = await res.json();
  
  if (!res.ok) {
    if (data.message === 'jwt expired') {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.accessToken) {
          const rawUser = document.cookie
            .split('; ')
            .find((row) => row.startsWith('eventra_user='));
          const userObj = rawUser ? JSON.parse(decodeURIComponent(rawUser.split('=')[1])) : null;
          setAuth(refreshData.accessToken, userObj);

          config.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          res = await fetch(`${API_BASE}${endpoint}`, config);
          data = await res.json();
          if (res.ok) {
            return data;
          }
        } else {
          logout();
          window.location.href = '/login';
          return;
        }
      } catch (err) {
        logout();
        window.location.href = '/login';
        throw err;
      }
    }

    const err = new Error(data.message || 'Something went wrong');
    err.errors = data.errors || null;
    err.statusCode = res.status;
    throw err;
  }
  return data;
}
