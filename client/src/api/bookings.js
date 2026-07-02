import { request } from './client';

export const bookingsAPI = {
  create: (bookingData) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  getUserBookings: () =>
    request('/bookings', {
      method: 'GET',
    }),

  cancel: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    }),

  getHoldStatus: () =>
    request('/bookings/hold/status', {
      method: 'GET',
    }),

  createHold: (holdData) =>
    request('/bookings/hold', {
      method: 'POST',
      body: JSON.stringify(holdData),
    }),

  cancelHold: (id) =>
    request(`/bookings/hold/${id}`, {
      method: 'DELETE',
    }),
};
