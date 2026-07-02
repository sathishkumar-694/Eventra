import { request } from './client';

export const authAPI = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getProfile: () =>
    request('/auth/profile', {
      method: 'GET',
    }),

  refresh: () =>
    request('/auth/refresh', {
      method: 'POST',
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    }),
};
