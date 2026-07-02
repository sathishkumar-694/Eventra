import { request } from './client';

export const rolesAPI = {
  createRequest: () =>
    request('/roles/request', {
      method: 'POST',
    }),

  getRequestStatus: () =>
    request('/roles/request/status', {
      method: 'GET',
    }),
};
