import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import authService from '../../../services/authService';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../../constants';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps app to provide authentication context
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      const payload = data && data.data ? data.data : {};
      const user = payload.user;
      const token = payload.accessToken || payload.token || null;

      if (user) {
        setUser(user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }

      if (token) {
        setToken(token);
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }

      navigate('/patients');
    }
  });

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login: loginMutation.mutate,
        logout,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Access authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
