import { request } from './client';

export const eventsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
      ),
    ).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },

  getById: (id) => request(`/events/${id}`),

  create: (eventData) =>
    request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  getOrganizerEvents: () =>
    request('/events/organizer/events', {
      method: 'GET',
    }),

  getLocations: () =>
    request('/events/locations', {
      method: 'GET',
    }),

  cancel: (id) =>
    request(`/events/${id}/cancel`, {
      method: 'PATCH',
    }),

  getAttendees: (id) =>
    request(`/events/${id}/attendees`, {
      method: 'GET',
    }),

  getAnalytics: () =>
    request('/events/organizer/analytics', {
      method: 'GET',
    }),
};
