import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosinstance';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ login: '', register: '', logout: '', profile: '' });


   useEffect(() => {
    const loadUserFromLocalStorage = () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
      const storedUser = localStorage.getItem('user'); // Store the full user data if available
      
      if (access && refresh && storedUser) {
        setUser(JSON.parse(storedUser)); // Parse and set user data
        setLoading(false); // Set loading to false once we know the user is authenticated
      } else {
        setLoading(false); // If no user or token, stop loading
      }
    };
    
    loadUserFromLocalStorage();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/authentication/login/', { username, password });
      
      if (response.data.status) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Store user data
        setUser(response.data.user);
        setErrors((prev) => ({ ...prev, login: '' }));
        return response.data;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setErrors((prev) => ({ ...prev, login: error.response?.data?.error || 'Login failed' }));
      return false;
    }
  };

  const register = async (data) => {
    try {
      const response = await axiosInstance.post('/authentication/register/', data);
      if (response.data.status) {
        localStorage.setItem('access', response.data.data.access);
        localStorage.setItem('refresh', response.data.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.data.user)); // Store user data
        setUser(response.data.data.user);
        setErrors((prev) => ({ ...prev, register: '' }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors((prev) => ({ ...prev, register: error.response?.data?.error || 'Registration failed' }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/logout/', { refresh: localStorage.getItem('refresh') });
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
      setErrors((prev) => ({ ...prev, logout: '' }));
    } catch (error) {
      console.error('Logout failed:', error);
      setErrors((prev) => ({ ...prev, logout: error.response?.data?.error || 'Logout failed' }));
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await axiosInstance.put('/profile/', data);
      setUser(response.data);
      setErrors((prev) => ({ ...prev, profile: '' }));
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      setErrors((prev) => ({ ...prev, profile: error.response?.data?.error || 'Profile update failed' }));
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, errors, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};