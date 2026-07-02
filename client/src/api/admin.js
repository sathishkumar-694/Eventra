import { request } from './client';

export const adminAPI = {
  getAllEvents: () =>
    request('/admin/events', {
      method: 'GET',
    }),

  getPendingEvents: () =>
    request('/admin/events/pending', {
      method: 'GET',
    }),

  approveEvent: (id) =>
    request(`/admin/events/${id}/approve`, {
      method: 'PATCH',
    }),

  rejectEvent: (id, reason) =>
    request(`/admin/events/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getAllRoleRequests: () =>
    request('/admin/role-requests', {
      method: 'GET',
    }),

  approveRoleRequest: (id) =>
    request(`/admin/role-requests/${id}/approve`, {
      method: 'PATCH',
    }),

  rejectRoleRequest: (id, reason) =>
    request(`/admin/role-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getStats: () =>
    request('/admin/stats', {
      method: 'GET',
    }),
};
