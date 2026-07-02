import { request } from './client';

export const waitlistAPI = {
  join: (eventId) =>
    request(`/waitlist/${eventId}`, {
      method: 'POST',
    }),

  getPosition: (eventId) =>
    request(`/waitlist/${eventId}/position`, {
      method: 'GET',
    }),

  leave: (eventId) =>
    request(`/waitlist/${eventId}`, {
      method: 'DELETE',
    }),

  getUserWaitlists: () =>
    request('/waitlist/my', {
      method: 'GET',
    }),
};
