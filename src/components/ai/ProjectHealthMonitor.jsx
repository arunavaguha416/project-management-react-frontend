// src/components/ai/ProjectHealthMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { aiService } from '../../services/ai/aiService';
import AIStatusIndicator from './AIStatusIndicator';

const ProjectHealthMonitor = ({ projectId = null }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Mock projects data - replace with actual API call
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        // Replace with actual projects API call
        // const response = await projectsService.getProjects();
        
        // Mock data for demonstration
        const mockProjects = [
          { id: 'proj-1', name: 'E-commerce Platform', status: 'Ongoing' },
          { id: 'proj-2', name: 'Mobile App Redesign', status: 'Ongoing' },
          { id: 'proj-3', name: 'Data Analytics Dashboard', status: 'Planning' },
          { id: 'proj-4', name: 'Customer Portal', status: 'Completed' },
        ];
        
        setProjects(mockProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const fetchProjectHealth = useCallback(async (projId) => {
    if (!projId) return;
    
    setLoading(true);
    try {
      const response = await aiService.getProjectHealth(projId);
      
      if (response.status) {
        setHealthData(response.records);
        setIsAiPowered(response.records?.ai_powered || false);
        setDemoMode(response.records?.demo_mode || false);
        setAiStatus(response.records?.ai_status || '');
      } else {
        setHealthData(null);
        console.warn('No health data found for project:', projId);
      }
    } catch (error) {
      console.error('Error fetching project health:', error);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectHealth(selectedProject);
    }
  }, [selectedProject, fetchProjectHealth]);

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    
    if (!projectId) {
      setHealthData(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getRiskColor = (risk) => {
    if (risk <= 30) return '#4caf50';
    if (risk <= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getRiskLevel = (risk) => {
    if (risk <= 30) return 'Low';
    if (risk <= 60) return 'Medium';
    return 'High';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  return (
    <div className="ai-components-container">
      {/* Header */}
      <div className="ai-header-content">
        <div className="ai-header-info">
          <h2 className="ai-page-title">Project Health Monitor</h2>
          <p className="ai-page-subtitle">AI-powered project health analysis and predictions</p>
        </div>
        <div className="ai-header-actions">
          {/* AI Status Indicator */}
          <AIStatusIndicator 
            isAiPowered={isAiPowered}
            demoMode={demoMode}
            aiStatus={aiStatus}
            className="ai-header-status"
          />

          {/* Dynamic Project Selector */}
          {projectsLoading ? (
            <div className="ai-loading-dropdown">
              <span>Loading projects...</span>
            </div>
          ) : (
            <select 
              className="ai-select"
              value={selectedProject}
              onChange={handleProjectChange}
              disabled={projects.length === 0}
            >
              <option value="">
                {projects.length === 0 ? 'No projects available' : 'Select a project...'}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.status})
                </option>
              ))}
            </select>
          )}
          
          <button 
            className="ai-action-btn primary"
            onClick={() => fetchProjectHealth(selectedProject)}
            disabled={loading || !selectedProject}
          >
            {loading ? (
              <>
                <span className="ai-btn-spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                <span className="ai-btn-icon">🔄</span>
                Refresh Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Project Info Banner */}
      {selectedProject && (
        <div className="ai-project-info-banner">
          <div className="ai-project-info">
            <h4>Analyzing: {getProjectName(selectedProject)}</h4>
            <span className="ai-project-id">Project ID: {selectedProject}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="ai-dashboard-grid">
        {loading ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-loading-state">
              <div className="ai-loading-spinner"></div>
              <p>Analyzing project health with AI...</p>
              <small>Our AI is evaluating project metrics, team performance, and risk factors</small>
            </div>
          </div>
        ) : !selectedProject ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-empty-state">
              <div className="ai-empty-icon">📊</div>
              <h3>Select a Project</h3>
              <p>Choose a project from the dropdown to view its health metrics and AI insights</p>
            </div>
          </div>
        ) : !healthData ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-empty-state">
              <div className="ai-empty-icon">⚠️</div>
              <h3>No Health Data Available</h3>
              <p>Unable to load health data for this project. Please try refreshing or select another project.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Health Score */}
            <div className="ai-dashboard-card">
              <h3 className="ai-card-title">Overall Health Score</h3>
              <div className="ai-health-score-display">
                <div 
                  className="ai-score-circle large"
                  style={{ 
                    background: `conic-gradient(${getScoreColor(healthData.overall_score)} ${healthData.overall_score * 3.6}deg, #f0f0f0 0deg)`
                  }}
                >
                  <div className="ai-score-inner">
                    <span className="ai-score-number">{healthData.overall_score}</span>
                    <span className="ai-score-label">{getScoreLabel(healthData.overall_score)}</span>
                  </div>
                </div>
                <div className="ai-score-details">
                  <div className="ai-risk-level">
                    <span className={`ai-risk-badge ${healthData.risk_level}`}>
                      {healthData.risk_level.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="ai-score-description">
                    Project is performing {getScoreLabel(healthData.overall_score).toLowerCase()} with {healthData.risk_level} risk level.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="ai-dashboard-card">
              <h3 className="ai-card-title">Risk Analysis</h3>
              <div className="ai-risk-factors">
                <div className="ai-risk-item">
                  <div className="ai-risk-header">
                    <span className="ai-risk-name">Timeline Risk</span>
                    <span 
                      className="ai-risk-value"
                      style={{ color: getRiskColor(healthData.timeline_risk) }}
                    >
                      {healthData.timeline_risk}% {getRiskLevel(healthData.timeline_risk)}
                    </span>
                  </div>
                  <div className="ai-progress-bar">
                    <div 
                      className="ai-progress-fill"
                      style={{ 
                        width: `${healthData.timeline_risk}%`,
                        backgroundColor: getRiskColor(healthData.timeline_risk)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="ai-risk-item">
                  <div className="ai-risk-header">
                    <span className="ai-risk-name">Resource Risk</span>
                    <span 
                      className="ai-risk-value"
                      style={{ color: getRiskColor(healthData.resource_risk) }}
                    >
                      {healthData.resource_risk}% {getRiskLevel(healthData.resource_risk)}
                    </span>
                  </div>
                  <div className="ai-progress-bar">
                    <div 
                      className="ai-progress-fill"
                      style={{ 
                        width: `${healthData.resource_risk}%`,
                        backgroundColor: getRiskColor(healthData.resource_risk)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="ai-risk-item">
                  <div className="ai-risk-header">
                    <span className="ai-risk-name">Quality Risk</span>
                    <span 
                      className="ai-risk-value"
                      style={{ color: getRiskColor(healthData.quality_risk) }}
                    >
                      {healthData.quality_risk}% {getRiskLevel(healthData.quality_risk)}
                    </span>
                  </div>
                  <div className="ai-progress-bar">
                    <div 
                      className="ai-progress-fill"
                      style={{ 
                        width: `${healthData.quality_risk}%`,
                        backgroundColor: getRiskColor(healthData.quality_risk)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="ai-risk-item">
                  <div className="ai-risk-header">
                    <span className="ai-risk-name">Budget Risk</span>
                    <span 
                      className="ai-risk-value"
                      style={{ color: getRiskColor(healthData.budget_risk) }}
                    >
                      {healthData.budget_risk}% {getRiskLevel(healthData.budget_risk)}
                    </span>
                  </div>
                  <div className="ai-progress-bar">
                    <div 
                      className="ai-progress-fill"
                      style={{ 
                        width: `${healthData.budget_risk}%`,
                        backgroundColor: getRiskColor(healthData.budget_risk)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Efficiency */}
            <div className="ai-dashboard-card">
              <h3 className="ai-card-title">Team Efficiency</h3>
              <div className="ai-efficiency-display">
                <div 
                  className="ai-score-circle medium"
                  style={{ 
                    background: `conic-gradient(${getScoreColor(healthData.team_efficiency)} ${healthData.team_efficiency * 3.6}deg, #f0f0f0 0deg)`
                  }}
                >
                  <div className="ai-score-inner">
                    <span className="ai-score-number">{healthData.team_efficiency}%</span>
                  </div>
                </div>
                <div className="ai-efficiency-info">
                  <p className="ai-efficiency-status">
                    Team is performing {getScoreLabel(healthData.team_efficiency).toLowerCase()}
                  </p>
                  <small className="ai-efficiency-note">
                    Based on task completion rates, collaboration metrics, and delivery speed
                  </small>
                </div>
              </div>
            </div>

            {/* AI Predictions */}
            {healthData.predictions && healthData.predictions.length > 0 && (
              <div className="ai-dashboard-card full-width">
                <h3 className="ai-card-title">
                  🔮 AI Predictions & Insights
                  {isAiPowered && <span className="ai-powered-badge">AI Powered</span>}
                </h3>
                <div className="ai-predictions-list">
                  {healthData.predictions.map((prediction) => (
                    <div key={prediction.id} className={`ai-prediction-item ${prediction.severity}`}>
                      <div className="ai-prediction-icon">
                        {prediction.type === 'timeline' && '⏱️'}
                        {prediction.type === 'resource' && '👥'}
                        {prediction.type === 'quality' && '🎯'}
                        {prediction.type === 'team' && '⭐'}
                      </div>
                      <div className="ai-prediction-content">
                        <div className="ai-prediction-message">
                          {prediction.message}
                        </div>
                        <div className="ai-prediction-meta">
                          <span className="ai-prediction-confidence">
                            {prediction.confidence}% confidence
                          </span>
                          <span className={`ai-prediction-severity ${prediction.severity}`}>
                            {prediction.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Summary */}
            <div className="ai-dashboard-card">
              <h3 className="ai-card-title">Analysis Summary</h3>
              <div className="ai-analysis-summary">
                <div className="ai-summary-item">
                  <span className="ai-summary-label">Last Analyzed:</span>
                  <span className="ai-summary-value">
                    {healthData.updated_at ? new Date(healthData.updated_at).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div className="ai-summary-item">
                  <span className="ai-summary-label">Analysis Mode:</span>
                  <span className="ai-summary-value">
                    {isAiPowered ? '🤖 AI Powered' : '🎭 Demo Mode'}
                  </span>
                </div>
                <div className="ai-summary-item">
                  <span className="ai-summary-label">Data Points:</span>
                  <span className="ai-summary-value">
                    Timeline, Resources, Quality, Budget, Team Performance
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectHealthMonitor;
