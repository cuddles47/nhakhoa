import apiClient from './apiClient';

/**
 * Authentication Service
 * Handles login, logout, and user profile
 */
class AuthService {
  /**
   * Login with username and password
   */
  async login(credentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call server to clear cookie
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout request failed:', err?.message || err);
    }
    // Clear local storage on logout
    localStorage.clear();
  }
}

export default new AuthService();
