import { request } from './client';

export const assistantAPI = {
  chat: (message) => request('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};
