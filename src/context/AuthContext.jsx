import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosinstance';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ 
    login: '', 
    register: '', 
    logout: '', 
    profile: '',
    timeTracking: ''
  });

  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
      const storedUser = localStorage.getItem('user');

      if (access && refresh && storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadUserFromLocalStorage();
  }, []);

  // Record login time
  const recordLoginTime = async () => {
    try {
      const response = await axiosInstance.post('/time-tracking/login-time/');
      if (response.data.status) {
        console.log('Login time recorded:', response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to record login time:', error);
      setErrors((prev) => ({ 
        ...prev, 
        timeTracking: 'Failed to record login time' 
      }));
    }
  };

  // Record logout time
  const recordLogoutTime = async () => {
    try {
      const response = await axiosInstance.post('/time-tracking/logout-time/');
      if (response.data.status) {
        console.log('Logout time recorded:', response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to record logout time:', error);
      setErrors((prev) => ({ 
        ...prev, 
        timeTracking: 'Failed to record logout time' 
      }));
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/authentication/login/', { 
        username, 
        password 
      });
      
      if (response.data.status) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setErrors((prev) => ({ ...prev, login: '', timeTracking: '' }));
        
        // Record login time after successful login
        await recordLoginTime();
        
        return response.data;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setErrors((prev) => ({ 
        ...prev, 
        login: error.response?.data?.error || 'Login failed' 
      }));
      return false;
    }
  };

  const register = async (data) => {
    try {
      const response = await axiosInstance.post('/authentication/register/', data);
      
      if (response.data.status) {
        localStorage.setItem('access', response.data.data.access);
        localStorage.setItem('refresh', response.data.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        setUser(response.data.data.user);
        setErrors((prev) => ({ ...prev, register: '', timeTracking: '' }));
        
        // Record login time after successful registration
        await recordLoginTime();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors((prev) => ({ 
        ...prev, 
        register: error.response?.data?.error || 'Registration failed' 
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      // Record logout time before logging out
      await recordLogoutTime();
      
      // Perform logout
      await axiosInstance.post('/logout/', { 
        refresh: localStorage.getItem('refresh') 
      });
      
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      
      setUser(null);
      setErrors((prev) => ({ ...prev, logout: '', timeTracking: '' }));
      
    } catch (error) {
      console.error('Logout failed:', error);
      setErrors((prev) => ({ 
        ...prev, 
        logout: error.response?.data?.error || 'Logout failed' 
      }));
      
      // Even if logout API fails, clear local storage
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      setUser(null);
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
      setErrors((prev) => ({ 
        ...prev, 
        profile: error.response?.data?.error || 'Profile update failed' 
      }));
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error: errors.login,
        errors,
        login,
        register,
        logout,
        updateProfile,
        recordLoginTime,
        recordLogoutTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
