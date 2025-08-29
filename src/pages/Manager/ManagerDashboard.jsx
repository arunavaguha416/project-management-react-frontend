import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import "../../assets/css/Dashboard.css";

const PAGE_SIZE = 5;

const ManagerDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State management
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

  // Loading states
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);

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

  // Fetch dashboard metrics
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

  // Fetch team members
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

  // Fetch managed projects
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

  // Fetch leave requests
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

  // Handle leave approval/rejection
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
  }, [authLoading, user, fetchMetrics, fetchTeamMembers, fetchManagedProjects, fetchLeaveRequests]);

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
            <h1 className="dashboard-title">Manager Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user.name}! Here's your team overview.</p>
          </div>
          <div className="header-actions">
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.total_projects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">🎯</div>
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
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{metricsLoading ? '...' : metrics.pending_leaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Team Members */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Team Members</h3>
            <span className="team-count">{teamMembers.length} members</span>
          </div>
          <div className="card-content">
            {teamLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading team...</p>
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="team-list">
                {teamMembers.map((member, index) => (
                  <div key={index} className="team-item">
                    <div className="member-avatar">
                      {getInitials(member.name)}
                    </div>
                    <div className="member-info">
                      <h4 className="member-name">{member.name || '--'}</h4>
                      <p className="member-email">{member.email}</p>
                      <div className="member-meta">
                        <span className="member-role">
                          {member.designation || member.role || '--'}
                        </span>
                        <span className="member-project">
                          {member.current_project || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <div className="member-status active">
                      {member.status || 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No team members found</h4>
                <p>Your team will appear here once assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Managed Projects */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>My Projects</h3>
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
                {managedProjects.map((project) => (
                  <div key={project.id} className="project-item">
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <div className="project-meta">
                        <div className="team-size">
                          <span className="team-icon">👥</span>
                          <span>{project.team_size || 0} members</span>
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
                      </div>
                    </div>
                    <div 
                      className="project-status"
                      style={{ color: getStatusColor(project.status) }}
                    >
                      {project.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h4>No projects assigned</h4>
                <p>Projects you manage will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>Team Leave Requests</h3>
            <span className="pending-count">{leaveRequests.length} pending</span>
          </div>
          <div className="card-content">
            {leaveLoading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Loading leave requests...</p>
              </div>
            ) : leaveRequests.length > 0 ? (
              <div className="leaves-table">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="leave-item">
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
                        <span className="from-date">{request.start_date}</span>
                        <span className="date-arrow">→</span>
                        <span className="to-date">{request.end_date}</span>
                      </div>
                      <span className="leave-days">
                        {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="leave-reason">
                      <p>{request.reason || 'No reason provided'}</p>
                    </div>
                    <div className="leave-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleLeaveAction(request.id, 'APPROVE')}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleLeaveAction(request.id, 'REJECT')}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No pending leave requests</h4>
                <p>All caught up! New requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;