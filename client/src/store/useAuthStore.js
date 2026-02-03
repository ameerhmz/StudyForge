import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Sign up
      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/api/auth/signup`, {
            email,
            password,
            name,
          });
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return response.data.data.user;
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Signup failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password,
          });
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return response.data.data.user;
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      // Logout
      logout: async () => {
        try {
          await axios.post(`${API_URL}/api/auth/logout`);
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      // Check auth status
      checkAuth: async () => {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`);
          set({
            user: response.data.data.user,
            isAuthenticated: true,
          });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      // Upgrade to teacher
      upgradeToTeacher: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/api/auth/upgrade-to-teacher`, {
            code,
          });
          set({
            user: response.data.data.user,
            isLoading: false,
          });
          return response.data.data.user;
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Upgrade failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
