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
};
