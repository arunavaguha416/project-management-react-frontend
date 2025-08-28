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
      console.log('🤖 Generating AI recommendations...');
      const response = await axiosInstance.post('/ai/recommendations/add/', params);
      
      if (response.data.ai_powered) {
        console.log('✅ Recommendations generated using Gemini AI');
      } else if (response.data.demo_mode) {
        console.log('🎭 Using intelligent demo recommendations');
        console.log('AI Status:', response.data.ai_status);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw error;
    }
  },

  async applyRecommendation(id) {
    try {
      console.log('📋 Applying AI recommendation:', id);
      const response = await axiosInstance.post('/ai/recommendations/apply/', { id });
      
      if (response.data.status) {
        console.log('✅ Recommendation applied successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error applying recommendation:', error);
      throw error;
    }
  },

  async deleteRecommendation(id) {
    try {
      console.log('🗑️ Dismissing AI recommendation:', id);
      const response = await axiosInstance.delete(`/ai/recommendations/delete/${id}/`);
      
      if (response.data.status) {
        console.log('✅ Recommendation dismissed successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  },

  // Project Health
  async getProjectHealth(projectId) {
    try {
      console.log('📊 Analyzing project health with AI:', projectId);
      const response = await axiosInstance.get(`/ai/health/${projectId}/`);
      
      if (response.data.records?.ai_powered) {
        console.log('✅ Project health analyzed using Gemini AI');
      } else if (response.data.records?.demo_mode) {
        console.log('🎭 Using demo health analysis');
        if (response.data.records?.ai_status) {
          console.log('AI Status:', response.data.records.ai_status);
        }
      }
      
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
  },

  // Test AI API Connection
  async testAIConnection() {
    try {
      console.log('🔧 Testing Google AI API connection...');
      const response = await axiosInstance.get('/ai/test/');
      
      if (response.data.status) {
        console.log('✅ Google AI API connection successful');
        console.log('Test Response:', response.data.test_response);
      } else {
        console.log('❌ Google AI API connection failed');
        console.log('Error:', response.data.message);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error testing AI connection:', error);
      throw error;
    }
  }
};
