import { request } from './client';

export const notificationsAPI = {
  getAll: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};
