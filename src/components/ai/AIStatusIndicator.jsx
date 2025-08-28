// src/components/ai/AIStatusIndicator.jsx
import React from 'react';

const AIStatusIndicator = ({ isAiPowered, demoMode, aiStatus, className = '' }) => {
  const getStatusConfig = () => {
    if (isAiPowered && !demoMode) {
      return {
        icon: '🤖',
        text: 'AI Powered',
        subtext: 'Using Gemini AI',
        className: 'ai-status-active',
        color: '#4CAF50'
      };
    } else if (demoMode) {
      return {
        icon: '🎭',
        text: 'Demo Mode',
        subtext: 'Intelligent simulation',
        className: 'ai-status-demo',
        color: '#FF9800'
      };
    } else {
      return {
        icon: '⚠️',
        text: 'AI Unavailable',
        subtext: 'Using fallback data',
        className: 'ai-status-unavailable',
        color: '#f44336'
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`ai-status-indicator ${config.className} ${className}`}>
      <div className="ai-status-badge">
        <span className="ai-status-icon">{config.icon}</span>
        <div className="ai-status-text">
          <span className="ai-status-primary">{config.text}</span>
          <span className="ai-status-secondary">{config.subtext}</span>
        </div>
      </div>
      {aiStatus && (
        <div className="ai-status-details" title={aiStatus}>
          <span className="ai-status-tooltip">{aiStatus}</span>
        </div>
      )}
    </div>
  );
};

export default AIStatusIndicator;
