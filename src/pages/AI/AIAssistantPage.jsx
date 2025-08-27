// src/pages/ai/AIAssistantPage.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import AIAssistant from '../../components/ai/AIAssistant';
import '../../assets/css/ai/ai-components.css';

const AIAssistantPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="ai-components-container">
      {/* Header */}
      <div className="ai-header-content ai-mb-32">
        <div className="ai-header-info">
          <h1 className="ai-page-title">AI Assistant</h1>
          <p className="ai-page-subtitle">
            Your intelligent project management companion for {user?.role?.toLowerCase()} tasks
          </p>
        </div>
        <div className="ai-header-actions">
          <button className="ai-action-btn secondary">
            <span className="ai-btn-icon">⚙️</span>
            Settings
          </button>
          <button className="ai-action-btn primary">
            <span className="ai-btn-icon">💡</span>
            Get Suggestions
          </button>
        </div>
      </div>

      {/* AI Assistant Content */}
      <div className="ai-dashboard-grid">
        <div className="ai-dashboard-card full-width">
          <AIAssistant />
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
