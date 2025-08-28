// src/components/ai/SmartResourceAllocation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { aiService } from '../../services/ai/aiService';
import AIStatusIndicator from './AIStatusIndicator';

const SmartResourceAllocation = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(null);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Show notification message
  const showNotification = useCallback((type, message) => {
    setShowMessage({ type, message });
    setTimeout(() => setShowMessage(null), 4000);
  }, []);

  // Generate AI recommendations
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await aiService.generateRecommendations();
      
      if (response.status) {
        setRecommendations(response.records || []);
        setIsAiPowered(response.ai_powered || false);
        setDemoMode(response.demo_mode || false);
        setAiStatus(response.ai_status || '');
        
        const message = response.ai_powered 
          ? `🤖 Generated ${response.records?.length || 0} AI-powered recommendations!`
          : `🎭 Generated ${response.records?.length || 0} demo recommendations for testing`;
        
        showNotification('success', message);
      } else {
        showNotification('error', 'Failed to generate recommendations. Please try again.');
      }
    } catch (error) {
      showNotification('error', 'Failed to generate recommendations. Please try again.');
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load recommendations on component mount
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await aiService.getRecommendations({ page: 1, page_size: 10 });
        if (response.status && response.records) {
          setRecommendations(response.records);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    };

    loadRecommendations();
  }, []);

  // Apply recommendation
  const handleApplyRecommendation = async (recommendationId, title) => {
    try {
      const response = await aiService.applyRecommendation(recommendationId);
      
      if (response.status) {
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, is_applied: true, applied_at: new Date().toISOString() }
              : rec
          )
        );
        showNotification('success', `Applied: ${title}`);
      } else {
        showNotification('error', response.message || 'Failed to apply recommendation');
      }
    } catch (error) {
      showNotification('error', 'Failed to apply recommendation');
      console.error('Error applying recommendation:', error);
    }
  };

  // Dismiss recommendation
  const handleDismissRecommendation = async (recommendationId, title) => {
    try {
      const response = await aiService.deleteRecommendation(recommendationId);
      
      if (response.status) {
        setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
        showNotification('success', `Dismissed: ${title}`);
      } else {
        showNotification('error', response.message || 'Failed to dismiss recommendation');
      }
    } catch (error) {
      showNotification('error', 'Failed to dismiss recommendation');
      console.error('Error dismissing recommendation:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (impact, severity) => {
    if (severity === 'critical' || impact === 'high') return '#f44336';
    if (severity === 'warning' || impact === 'medium') return '#ff9800';
    return '#4caf50';
  };

  // Get confidence indicator
  const getConfidenceIndicator = (confidence) => {
    if (confidence >= 90) return { text: 'Very High', color: '#4caf50' };
    if (confidence >= 80) return { text: 'High', color: '#8bc34a' };
    if (confidence >= 70) return { text: 'Good', color: '#ff9800' };
    return { text: 'Moderate', color: '#f44336' };
  };

  return (
    <div className="ai-components-container">
      {/* Header */}
      <div className="ai-header-content">
        <div className="ai-header-info">
          <h2 className="ai-page-title">Smart Resource Allocation</h2>
          <p className="ai-page-subtitle">
            AI-powered recommendations for optimal team performance and resource distribution
          </p>
        </div>
        <div className="ai-header-actions">
          {/* AI Status Indicator */}
          <AIStatusIndicator 
            isAiPowered={isAiPowered}
            demoMode={demoMode}
            aiStatus={aiStatus}
            className="ai-header-status"
          />
          
          <button 
            className="ai-action-btn primary"
            onClick={generateRecommendations}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="ai-btn-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="ai-btn-icon">🤖</span>
                Generate Recommendations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification */}
      {showMessage && (
        <div className={`ai-notification ${showMessage.type}`}>
          <span className="ai-notification-text">{showMessage.message}</span>
          <button 
            className="ai-notification-close"
            onClick={() => setShowMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div className="ai-dashboard-grid">
        {loading ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-loading-state">
              <div className="ai-loading-spinner"></div>
              <p>Analyzing team data and generating intelligent recommendations...</p>
              <small>This may take a few moments while our AI processes your project data</small>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-empty-state">
              <div className="ai-empty-icon">🎯</div>
              <h3>No Recommendations Yet</h3>
              <p>Click "Generate Recommendations" to get AI-powered suggestions for optimizing your team's resource allocation</p>
              <button 
                className="ai-empty-action-btn"
                onClick={generateRecommendations}
              >
                <span className="ai-btn-icon">🤖</span>
                Get Started with AI
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Recommendations Grid */}
            <div className="ai-recommendations-grid">
              {recommendations.map((recommendation) => {
                const confidenceInfo = getConfidenceIndicator(recommendation.confidence);
                const priorityColor = getPriorityColor(recommendation.impact, recommendation.severity);

                return (
                  <div key={recommendation.id} className="ai-recommendation-card">
                    {/* Card Header */}
                    <div className="ai-card-header">
                      <div className="ai-card-title-section">
                        <h3 className="ai-card-title">{recommendation.title}</h3>
                        <div className="ai-card-badges">
                          <span 
                            className={`ai-badge ${recommendation.recommendation_type}`}
                          >
                            {recommendation.recommendation_type.replace('_', ' ')}
                          </span>
                          <span 
                            className={`ai-badge ${recommendation.impact}`}
                            style={{ borderColor: priorityColor, color: priorityColor }}
                          >
                            {recommendation.impact} impact
                          </span>
                        </div>
                      </div>
                      <div className="ai-confidence-indicator">
                        <div className="ai-confidence-circle" style={{ borderColor: confidenceInfo.color }}>
                          <span>{recommendation.confidence}%</span>
                        </div>
                        <small style={{ color: confidenceInfo.color }}>{confidenceInfo.text}</small>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="ai-card-content">
                      <p className="ai-card-description">
                        {recommendation.description}
                      </p>

                      {recommendation.estimated_benefit && (
                        <div className="ai-benefit-highlight">
                          <span className="ai-benefit-icon">📈</span>
                          <span className="ai-benefit-text">
                            Expected: {recommendation.estimated_benefit}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="ai-card-actions">
                      {recommendation.is_applied ? (
                        <div className="ai-applied-status">
                          <span className="ai-applied-icon">✅</span>
                          <span>Applied {new Date(recommendation.applied_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <>
                          <button 
                            className="ai-action-btn success"
                            onClick={() => handleApplyRecommendation(recommendation.id, recommendation.title)}
                          >
                            <span className="ai-btn-icon">✓</span>
                            Apply
                          </button>
                          <button 
                            className="ai-action-btn secondary"
                            onClick={() => handleDismissRecommendation(recommendation.id, recommendation.title)}
                          >
                            <span className="ai-btn-icon">✕</span>
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Statistics */}
            <div className="ai-dashboard-card">
              <h3 className="ai-card-title">Recommendations Summary</h3>
              <div className="ai-summary-stats">
                <div className="ai-stat-item">
                  <div className="ai-stat-value">{recommendations.length}</div>
                  <div className="ai-stat-label">Total Recommendations</div>
                </div>
                <div className="ai-stat-item">
                  <div className="ai-stat-value">
                    {recommendations.filter(r => r.is_applied).length}
                  </div>
                  <div className="ai-stat-label">Applied</div>
                </div>
                <div className="ai-stat-item">
                  <div className="ai-stat-value">
                    {recommendations.filter(r => r.impact === 'high').length}
                  </div>
                  <div className="ai-stat-label">High Impact</div>
                </div>
                <div className="ai-stat-item">
                  <div className="ai-stat-value">
                    {Math.round(recommendations.reduce((acc, r) => acc + r.confidence, 0) / recommendations.length)}%
                  </div>
                  <div className="ai-stat-label">Avg Confidence</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartResourceAllocation;
