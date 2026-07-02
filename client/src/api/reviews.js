import { request } from './client';

export const reviewsAPI = {
  create: (reviewData) =>
    request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  getByEvent: (eventId) =>
    request(`/reviews/event/${eventId}`, {
      method: 'GET',
    }),

  delete: (id) =>
    request(`/reviews/${id}`, {
      method: 'DELETE',
    }),
};
