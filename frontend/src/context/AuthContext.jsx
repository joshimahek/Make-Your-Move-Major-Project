/**
 * Auth context — manages user authentication state across the app.
 * Auto-checks /api/auth/me/ on mount to restore login from session cookie.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while checking session
  const [authError, setAuthError] = useState(null);

  // On mount: check if user is already logged in via session cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authAPI.me();
        setUser(res.data.user);
      } catch {
        // Not logged in — that's fine
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authAPI.login({ email, password });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      if (err.response?.data?.requires_verification) {
        setUser(null);
        return err.response.data;
      }
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authAPI.register({ name, email, password });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authAPI.verifyOTP(email, otp);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const responseData = err.response?.data || {};
      const message = responseData.error || 'Verification failed. Please try again.';
      const error = new Error(message);
      error.attemptsRemaining = responseData.attempts_remaining;
      error.expired = responseData.expired || false;
      setAuthError(message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors — clear local state anyway
    }
    setUser(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const value = {
    user,
    authLoading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.is_staff || false,
    login,
    register,
    verifyOTP,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
