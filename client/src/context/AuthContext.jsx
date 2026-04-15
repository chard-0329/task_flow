import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await api.get('/auth/me');
        if (isMounted) {
          setStudent(response.data.student);
        }
      } catch {
        if (isMounted) {
          setStudent(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function register(formData) {
    const response = await api.post('/auth/register', formData);
    setStudent(response.data.student);
    return response.data.student;
  }

  async function login(formData) {
    const response = await api.post('/auth/login', formData);
    setStudent(response.data.student);
    return response.data.student;
  }

  async function logout() {
    await api.post('/auth/logout');
    setStudent(null);
  }

  const value = useMemo(
    () => ({
      student,
      isAuthenticated: Boolean(student),
      isCheckingSession,
      register,
      login,
      logout
    }),
    [student, isCheckingSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
