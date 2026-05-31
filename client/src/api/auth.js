const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling.
 * Throws an object with { message, errors } on failure.
 */
async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // Attach auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.errors = data.errors || null;
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

// ─── Auth API ───────────────────────────────────────────

export const authAPI = {
  /**
   * Register a new user
   * @param {{ username: string, email: string, password: string }} userData
   */
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  /**
   * Login with email and password
   * @param {{ email: string, password: string }} credentials
   * @returns {{ success: boolean, message: string, data: object, token: string }}
   */
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  /**
   * Get current user's profile (requires auth token)
   */
  getProfile: () =>
    request('/auth/profile', {
      method: 'GET',
    }),
};
