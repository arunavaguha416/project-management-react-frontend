// src/components/ai/SmartResourceAllocation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { aiService } from '../../services/ai/aiService';

const SmartResourceAllocation = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(null);

  // Static workload data for demo
  const workloadData = {
    teams: [
      { name: 'Frontend Team', workload: 75, status: 'good' },
      { name: 'Backend Team', workload: 85, status: 'warning' },
      { name: 'QA Team', workload: 60, status: 'good' }
    ],
    skillMatch: 92,
    riskLevel: 'medium'
  };

  const showNotification = (type, message) => {
    setShowMessage({ type, message });
    setTimeout(() => setShowMessage(null), 4000);
  };

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await aiService.getRecommendations({
        page: 1,
        page_size: 10,
        is_applied: false
      });
      
      if (response.status) {
        setRecommendations(response.records || []);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await aiService.generateRecommendations();
      
      if (response.status) {
        showNotification('success', response.message);
        await fetchRecommendations(); // Refresh the list
      } else {
        showNotification('error', response.message || 'Failed to generate recommendations');
      }
    } catch (error) {
      showNotification('error', 'Failed to generate recommendations. Please try again.');
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

  const applyRecommendation = async (recId) => {
    try {
      const response = await aiService.applyRecommendation(recId);
      
      if (response.status) {
        showNotification('success', response.message);
        setRecommendations(prev => prev.filter(rec => rec.id !== recId));
      } else {
        showNotification('error', response.message || 'Failed to apply recommendation');
      }
    } catch (error) {
      showNotification('error', 'Failed to apply recommendation.');
      console.error('Error applying recommendation:', error);
    }
  };

  const dismissRecommendation = async (recId) => {
    try {
      const response = await aiService.deleteRecommendation(recId);
      
      if (response.status) {
        showNotification('info', 'Recommendation dismissed');
        setRecommendations(prev => prev.filter(rec => rec.id !== recId));
      } else {
        showNotification('error', response.message || 'Failed to dismiss recommendation');
      }
    } catch (error) {
      showNotification('error', 'Failed to dismiss recommendation.');
      console.error('Error dismissing recommendation:', error);
    }
  };

  // Load initial recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="ai-components-container">
      {/* Notification */}
      {showMessage && (
        <div className={`ai-notification ai-notification-${showMessage.type}`}>
          <span className="ai-notification-icon">
            {showMessage.type === 'success' ? '✅' : 
             showMessage.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="ai-notification-message">{showMessage.message}</span>
          <button 
            className="ai-notification-close"
            onClick={() => setShowMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="ai-header-content">
        <div className="ai-header-info">
          <h2 className="ai-page-title">AI Resource Allocation</h2>
          <p className="ai-page-subtitle">Intelligent team matching and workload optimization</p>
        </div>
        <div className="ai-header-actions">
          <button 
            className="ai-action-btn primary"
            onClick={generateRecommendations}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="ai-btn-spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                <span className="ai-btn-icon">🧠</span>
                Generate AI Recommendations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ai-stats-grid">
        <div className="ai-stat-card primary">
          <div className="ai-stat-icon">👥</div>
          <div className="ai-stat-content">
            <h3>{workloadData.skillMatch}%</h3>
            <p>Skill Match Score</p>
          </div>
        </div>
        
        <div className="ai-stat-card warning">
          <div className="ai-stat-icon">⚠️</div>
          <div className="ai-stat-content">
            <h3>3</h3>
            <p>Risk Factors</p>
          </div>
        </div>
        
        <div className="ai-stat-card success">
          <div className="ai-stat-icon">📈</div>
          <div className="ai-stat-content">
            <h3>{recommendations.length}</h3>
            <p>Active Recommendations</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="ai-dashboard-grid">
        {/* Team Workload Card */}
        <div className="ai-dashboard-card">
          <div className="ai-card-header">
            <h3>Team Workload Balance</h3>
            <div className="ai-badge success">Optimized</div>
          </div>
          <div className="ai-card-content">
            {workloadData.teams.map((team, index) => (
              <div key={index} className="ai-progress-container">
                <span>{team.name}</span>
                <div className="ai-progress-bar">
                  <div 
                    className="ai-progress-fill" 
                    style={{ width: `${team.workload}%` }}
                  />
                </div>
                <span className="ai-progress-text">{team.workload}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="ai-dashboard-card full-width">
          <div className="ai-card-header">
            <h3>AI Recommendations ({recommendations.length})</h3>
          </div>
          <div className="ai-card-content">
            <div className="ai-items-list">
              {loading ? (
                <div className="ai-loading-state">
                  <div className="ai-loading-spinner"></div>
                  <p>Loading recommendations...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="ai-empty-state">
                  <div className="ai-empty-icon">🧠</div>
                  <p>Click "Generate AI Recommendations" to get intelligent suggestions</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="ai-item">
                    <div className="ai-item-info">
                      <h4 className="ai-item-title">{rec.title}</h4>
                      <p className="ai-item-description">{rec.description}</p>
                      <div className="ai-flex ai-gap-8">
                        <div className={`ai-badge ${
                          rec.impact === 'high' ? 'error' : 
                          rec.impact === 'medium' ? 'warning' : 'info'
                        }`}>
                          {rec.impact} Impact
                        </div>
                        <div className={`ai-badge ${
                          rec.severity === 'critical' ? 'error' :
                          rec.severity === 'warning' ? 'warning' : 'info'
                        }`}>
                          {rec.severity}
                        </div>
                        <span className="ai-progress-text">
                          AI Confidence: {rec.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="ai-item-meta">
                      <button 
                        className="ai-action-btn secondary"
                        onClick={() => dismissRecommendation(rec.id)}
                      >
                        Dismiss
                      </button>
                      <button 
                        className="ai-action-btn primary"
                        onClick={() => applyRecommendation(rec.id)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartResourceAllocation;
