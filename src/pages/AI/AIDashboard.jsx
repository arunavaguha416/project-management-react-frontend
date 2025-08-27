// src/components/ai/ProjectHealthMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { aiService } from '../../services/ai/aiService';
import axiosInstance from '../../services/axiosinstance';

const ProjectHealthMonitor = ({ projectId = null }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Fetch projects from backend API
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const response = await axiosInstance.post('/projects/list/', {
          page: 1,
          page_size: 100, // Fetch more projects for dropdown
          search: ''
        });
        
        if (response.data.status) {
          setProjects(response.data.records || []);
        } else {
          setProjects([]);
          console.warn('No projects found:', response.data.message);
        }
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
    
    // Clear previous health data when changing projects
    if (!projectId) {
      setHealthData(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
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
              <p>Analyzing project health...</p>
            </div>
          </div>
        ) : !selectedProject ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-empty-state">
              <div className="ai-empty-icon">📊</div>
              <h3>Select a Project</h3>
              <p>Choose a project from the dropdown to view its health metrics and AI insights</p>
              {projects.length === 0 && !projectsLoading && (
                <div className="ai-no-projects-message">
                  <p>No projects found. <a href="/add-project">Create your first project</a></p>
                </div>
              )}
            </div>
          </div>
        ) : !healthData ? (
          <div className="ai-dashboard-card full-width">
            <div className="ai-empty-state">
              <div className="ai-empty-icon">❌</div>
              <h3>No Health Data Available</h3>
              <p>Unable to fetch health metrics for this project. Try refreshing the analysis.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Health Score */}
            <div className="ai-dashboard-card">
              <div className="ai-card-header">
                <h3>Overall Health Score</h3>
                <div className={`ai-badge ${healthData.overall_score >= 80 ? 'success' : healthData.overall_score >= 60 ? 'warning' : 'error'}`}>
                  {getScoreLabel(healthData.overall_score)}
                </div>
              </div>
              <div className="ai-card-content">
                <div className="ai-health-score">
                  <div 
                    className="ai-health-circle"
                    style={{ '--score': healthData.overall_score, '--color': getScoreColor(healthData.overall_score) }}
                  >
                    <span className="ai-health-value">{healthData.overall_score}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="ai-dashboard-card">
              <div className="ai-card-header">
                <h3>Risk Analysis</h3>
              </div>
              <div className="ai-card-content">
                <div className="ai-risk-metrics">
                  <div className="ai-risk-item">
                    <span className="ai-risk-label">Timeline Risk</span>
                    <div className="ai-risk-bar">
                      <div 
                        className="ai-risk-fill timeline"
                        style={{ width: `${healthData.timeline_risk}%` }}
                      />
                    </div>
                    <span className="ai-risk-value">{healthData.timeline_risk}%</span>
                  </div>
                  
                  <div className="ai-risk-item">
                    <span className="ai-risk-label">Resource Risk</span>
                    <div className="ai-risk-bar">
                      <div 
                        className="ai-risk-fill resource"
                        style={{ width: `${healthData.resource_risk}%` }}
                      />
                    </div>
                    <span className="ai-risk-value">{healthData.resource_risk}%</span>
                  </div>
                  
                  <div className="ai-risk-item">
                    <span className="ai-risk-label">Quality Risk</span>
                    <div className="ai-risk-bar">
                      <div 
                        className="ai-risk-fill quality"
                        style={{ width: `${healthData.quality_risk}%` }}
                      />
                    </div>
                    <span className="ai-risk-value">{healthData.quality_risk}%</span>
                  </div>

                  <div className="ai-risk-item">
                    <span className="ai-risk-label">Budget Risk</span>
                    <div className="ai-risk-bar">
                      <div 
                        className="ai-risk-fill budget"
                        style={{ width: `${healthData.budget_risk}%` }}
                      />
                    </div>
                    <span className="ai-risk-value">{healthData.budget_risk}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="ai-dashboard-card">
              <div className="ai-card-header">
                <h3>Team Efficiency</h3>
                <div className={`ai-badge ${healthData.team_efficiency >= 80 ? 'success' : 'warning'}`}>
                  {healthData.team_efficiency}%
                </div>
              </div>
              <div className="ai-card-content">
                <div className="ai-efficiency-chart">
                  <div className="ai-efficiency-bar">
                    <div 
                      className="ai-efficiency-fill"
                      style={{ width: `${healthData.team_efficiency}%` }}
                    />
                  </div>
                  <p className="ai-efficiency-text">
                    Team is performing at {healthData.team_efficiency}% efficiency
                  </p>
                </div>
              </div>
            </div>

            {/* AI Predictions */}
            <div className="ai-dashboard-card full-width">
              <div className="ai-card-header">
                <h3>AI Predictions & Insights</h3>
                <div className="ai-prediction-count">
                  {healthData.predictions?.length || 0} insights
                </div>
              </div>
              <div className="ai-card-content">
                <div className="ai-predictions-list">
                  {healthData.predictions && healthData.predictions.length > 0 ? (
                    healthData.predictions.map((prediction) => (
                      <div key={prediction.id} className="ai-prediction-item">
                        <div className="ai-prediction-icon">
                          {prediction.type === 'timeline' ? '⏱️' : 
                           prediction.type === 'resource' ? '👥' :
                           prediction.type === 'quality' ? '✅' : '📊'}
                        </div>
                        <div className="ai-prediction-content">
                          <p className="ai-prediction-message">{prediction.message}</p>
                          <div className="ai-prediction-meta">
                            <span className="ai-prediction-confidence">
                              Confidence: {prediction.confidence}%
                            </span>
                            <span className={`ai-prediction-severity ${prediction.severity}`}>
                              {prediction.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ai-no-predictions">
                      <p>No predictions available for this project at the moment.</p>
                    </div>
                  )}
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
