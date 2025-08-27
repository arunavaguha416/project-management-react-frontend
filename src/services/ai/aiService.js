// src/services/ai/aiService.js
import axiosInstance from '../axiosinstance';

export const aiService = {
  // AI Recommendations
  async getRecommendations(params = {}) {
    try {
      const response = await axiosInstance.post('/ai/recommendations/list/', params);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      throw error;
    }
  },

  async generateRecommendations(params = { generate_ai: true }) {
    try {
      const response = await axiosInstance.post('/ai/recommendations/add/', params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw error;
    }
  },

  async getRecommendationDetails(id) {
    try {
      const response = await axiosInstance.post('/ai/recommendations/details/', { id });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation details:', error);
      throw error;
    }
  },

  async applyRecommendation(id) {
    try {
      const response = await axiosInstance.post('/ai/recommendations/apply/', { id });
      return response.data;
    } catch (error) {
      console.error('Error applying recommendation:', error);
      throw error;
    }
  },

  async updateRecommendation(id, data) {
    try {
      const response = await axiosInstance.put('/ai/recommendations/update/', { id, ...data });
      return response.data;
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  },

  async deleteRecommendation(id) {
    try {
      const response = await axiosInstance.delete(`/ai/recommendations/delete/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  },

  // Project Health
  async getProjectHealth(projectId) {
    try {
      const response = await axiosInstance.get(`/ai/health/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project health:', error);
      throw error;
    }
  },

  // AI Analytics
  async getAnalytics() {
    try {
      const response = await axiosInstance.get('/ai/analytics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
      throw error;
    }
  },

  // Role-specific Insights
  async getManagerInsights() {
    try {
      const response = await axiosInstance.get('/ai/insights/manager/');
      return response.data;
    } catch (error) {
      console.error('Error fetching manager insights:', error);
      throw error;
    }
  },

  async getHRInsights() {
    try {
      const response = await axiosInstance.get('/ai/insights/hr/');
      return response.data;
    } catch (error) {
      console.error('Error fetching HR insights:', error);
      throw error;
    }
  },

  async getEmployeeInsights() {
    try {
      const response = await axiosInstance.get('/ai/insights/employee/');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee insights:', error);
      throw error;
    }
  }
};
