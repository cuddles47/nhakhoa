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
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  /**
   * Logout user
   */
  logout() {
    // Clear local storage on logout
    localStorage.clear();
  }
}

export default new AuthService();
