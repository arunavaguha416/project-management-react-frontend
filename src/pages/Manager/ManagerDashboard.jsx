import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import SmartResourceAllocation from '../../components/ai/SmartResourceAllocation';
import ProjectHealthMonitor from '../../components/ai/ProjectHealthMonitor';
import "../../assets/css/Dashboard.css";
import '../../assets/css/ai/ai-components.css';

const PAGE_SIZE = 5;

const ManagerDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Existing state
  const [metrics, setMetrics] = useState({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    team_size: 0,
    pending_leaves: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [managedProjects, setManagedProjects] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // AI-related state
  const [aiInsights, setAiInsights] = useState({
    resourceOptimization: 0,
    projectRiskLevel: 'low',
    teamEfficiency: 85,
    aiRecommendations: 0
  });
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Loading states
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Utility functions
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#4caf50',
      'Active': '#4caf50',
      'Completed': '#2196f3',
      'On Hold': '#ff9800',
      'Cancelled': '#f44336',
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'REJECTED': '#f44336'
    };
    return colors[status] || '#757575';
  };

  // Existing fetch functions
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await axiosInstance.get(
        '/hr-management/manager/dashboard-metrics/',
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setMetrics(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
    setMetricsLoading(false);
  }, [user]);

  const fetchTeamMembers = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await axiosInstance.post(
        'teams/members/',
        { page: 1, page_size: PAGE_SIZE },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setTeamMembers(res.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
    setTeamLoading(false);
  }, [user]);

  const fetchManagedProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await axiosInstance.post(
        '/projects/manager/projects/list',
        { page: 1, page_size: PAGE_SIZE },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setManagedProjects(res.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching managed projects:', error);
    }
    setProjectsLoading(false);
  }, [user]);

  const fetchLeaveRequests = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const res = await axiosInstance.post(
        '/hr-management/manager/leave-requests/',
        { status: 'PENDING', page: 1, page_size: PAGE_SIZE },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setLeaveRequests(res.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
    setLeaveLoading(false);
  }, [user]);

  // New AI insights fetch
  const fetchAIInsights = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await axiosInstance.get(
        '/ai/manager-insights/',
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        setAiInsights(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Set mock data for demo
      setAiInsights({
        resourceOptimization: 12,
        projectRiskLevel: 'medium',
        teamEfficiency: 85,
        aiRecommendations: 6
      });
    }
    setAiLoading(false);
  }, [user]);

  // Handle leave actions
  const handleLeaveAction = async (requestId, action) => {
    try {
      const res = await axiosInstance.post(
        '/hr-management/manager/leave-request/action/',
        { request_id: requestId, action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        fetchLeaveRequests();
        fetchMetrics();
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  // Initialize dashboard data
  useEffect(() => {
    if (authLoading || !user) return;
    fetchMetrics();
    fetchTeamMembers();
    fetchManagedProjects();
    fetchLeaveRequests();
    fetchAIInsights();
  }, [authLoading, user, fetchMetrics, fetchTeamMembers, fetchManagedProjects, fetchLeaveRequests, fetchAIInsights]);

  if (authLoading || !user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
            <p className="dashboard-subtitle">Here's your team overview with AI insights.</p>
          </div>
          <div className="header-actions">
            <button 
              className={`action-btn ${showAIPanel ? 'primary' : 'secondary'}`}
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <span className="btn-icon">🤖</span>
              AI Insights
            </button>
            <button 
              className="action-btn primary"
              onClick={() => navigate('/add-project')}
            >
              <span className="btn-icon">➕</span>
              Add Project
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with AI */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.total_projects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.active_projects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.team_size}</h3>
            <p>Team Size</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.pending_leaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
        {/* AI Stats */}
        <div className="stat-card ai-stat primary">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiInsights.teamEfficiency}%</h3>
            <p>AI Team Efficiency</p>
          </div>
        </div>
        <div className="stat-card ai-stat warning">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{aiLoading ? '...' : aiInsights.aiRecommendations}</h3>
            <p>AI Recommendations</p>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="ai-components-container ai-mb-32">
          <div className="ai-dashboard-grid">
            <div className="ai-dashboard-card full-width">
              <SmartResourceAllocation />
            </div>
            <div className="ai-dashboard-card full-width">
              <ProjectHealthMonitor projectId="manager-overview" />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Team Members */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Team Members</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/employee-list')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {teamLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading team...</p>
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="employees-list">
                {teamMembers.slice(0, 5).map((member, index) => (
                  <div key={index} className="employee-item">
                    <div className="employee-avatar">
                      {getInitials(member.name)}
                    </div>
                    <div className="employee-info">
                      <h4 className="employee-name">{member.name}</h4>
                      <p className="employee-email">{member.email}</p>
                      <div className="employee-meta">
                        <span className="employee-role">{member.role}</span>
                        <span className="employee-status active">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>Your team will appear here once assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Managed Projects */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Managed Projects</h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/project-list')}
            >
              View All
            </button>
          </div>
          <div className="card-content">
            {projectsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading projects...</p>
              </div>
            ) : managedProjects.length > 0 ? (
              <div className="projects-list">
                {managedProjects.slice(0, 5).map((project, index) => (
                  <div key={index} className="project-item">
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <div className="project-meta">
                        <div className="manager-info">
                          <div className="manager-avatar">
                            {getInitials(project.manager_name)}
                          </div>
                          <span>{project.manager_name}</span>
                        </div>
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{project.progress || 0}%</span>
                        </div>
                        <span className="team-size">
                          <span className="team-icon">👥</span>
                          {project.team_size || 0}
                        </span>
                      </div>
                      <span 
                        className="project-status"
                        style={{ color: getStatusColor(project.status) }}
                      >
                        {project.status}
                      </span>
                    </div>
                    <button 
                      className="assign-btn"
                      onClick={() => navigate(`/project-details/${project.id}`)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>Projects you manage will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h2>Pending Leave Requests</h2>
            <span className="pending-count">{leaveRequests.length}</span>
          </div>
          <div className="card-content">
            {leaveLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave requests...</p>
              </div>
            ) : leaveRequests.length > 0 ? (
              <div className="leaves-table">
                {leaveRequests.map((request, index) => (
                  <div key={index} className="leave-item">
                    <div className="leave-employee">
                      <div className="employee-avatar">
                        {getInitials(request.employee_name)}
                      </div>
                      <div className="employee-details">
                        <h4>{request.employee_name}</h4>
                        <p>{request.employee_email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="leave-dates">
                      <div className="date-range">
                        <span>{request.start_date}</span>
                        <span className="date-arrow">→</span>
                        <span>{request.end_date}</span>
                      </div>
                      <span className="leave-days">{request.days} days</span>
                    </div>
                    <div className="leave-reason">
                      <p>{request.reason || 'No reason provided'}</p>
                    </div>
                    <div className="leave-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleLeaveAction(request.id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleLeaveAction(request.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h4>All caught up!</h4>
                <p>New requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
