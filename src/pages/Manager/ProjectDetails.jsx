import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import axiosInstance from "../../services/axiosinstance";
import "../../assets/css/ProjectDetails.css";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State management
  const [projectData, setProjectData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamSize: 0,
    completionPercentage: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Utility functions
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('complet') || statusLower === 'done') return '#4caf50';
    if (statusLower.includes('progress') || statusLower === 'ongoing') return '#2196f3';
    if (statusLower.includes('review')) return '#ff9800';
    if (statusLower.includes('block')) return '#f44336';
    return '#757575';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': '#f44336',
      'MEDIUM': '#ff9800',
      'LOW': '#4caf50'
    };
    return colors[priority?.toUpperCase()] || '#757575';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Data fetchers
  const fetchProjectDetails = useCallback(async () => {
    try {
      const projectResp = await axiosInstance.get(`/projects/details/${id}/`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (projectResp.data.status && projectResp.data.records) {
        setProjectData(projectResp.data.records);
      } else {
        setError("Failed to load project details");
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
      setError("Failed to load project details");
    }
  }, [id, user.token]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const teamResp = await axiosInstance.post(
        `/teams/team-members/`,
        { project_id: id, page_size: 50 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      if (teamResp.data.status) {
        const members = teamResp.data.records || [];
        setTeamMembers(members);
        setStats(prev => ({ ...prev, teamSize: members.length }));
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }, [id, user.token]);

  const fetchTasks = useCallback(async () => {
    try {
      const tasksResp = await axiosInstance.post(
        `/projects/tasks/list/`,
        { project_id: id, page_size: 100 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      if (tasksResp.data.status) {
        const projectTasks = tasksResp.data.records || [];
        setTasks(projectTasks);
        
        const completed = projectTasks.filter(t => 
          t.status === "DONE" || t.status === "COMPLETED"
        ).length;
        const total = projectTasks.length;
        const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        setStats(prev => ({
          ...prev,
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: total - completed,
          completionPercentage
        }));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [id, user.token]);

  const fetchMilestones = useCallback(async () => {
    try {
      const milestonesResp = await axiosInstance.post(
        `/projects/milestones/list/`,
        { project_id: id, page_size: 20 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      if (milestonesResp.data.status) {
        setMilestones(milestonesResp.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  }, [id, user.token]);

  const fetchFiles = useCallback(async () => {
    try {
      const filesResp = await axiosInstance.post(
        `/projects/upload-files-list/`,
        { project_id: id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      if (filesResp.data.status) {
        setFiles(filesResp.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [id, user.token]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchProjectDetails(),
        fetchTeamMembers(),
        fetchTasks(),
        fetchMilestones(),
        fetchFiles(),
      ]);
    } catch (error) {
      console.error("Error fetching project data:", error);
      setError("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjectDetails, fetchTeamMembers, fetchTasks, fetchMilestones, fetchFiles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="project-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-details-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Project</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={fetchData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="project-details-container">
      {/* Back Button */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <span className="back-icon">←</span>
          <span className="back-text">Back</span>
        </button>
      </div>

      {/* Project Header */}
      <div className="project-details-header">
        <div className="header-content">
          <div className="project-info">
            <h1 className="project-title">{projectData?.name || "Project Details"}</h1>
            
            <div className="project-meta">
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span 
                  className="project-status"
                  style={{ color: getStatusColor(projectData?.status) }}
                >
                  {projectData?.status || 'Unknown'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration:</span>
                <span className="project-duration">
                  {formatDate(projectData?.start_date)} - {formatDate(projectData?.end_date)}
                </span>
              </div>
              {projectData?.manager && (
                <div className="meta-item">
                  <span className="meta-label">Manager:</span>
                  <div className="manager-info">
                    <div className="manager-avatar">
                      {getInitials(projectData.manager.name)}
                    </div>
                    <span className="manager-name">{projectData.manager.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="header-actions">
            {(user.role === 'HR' || user.role === 'MANAGER') && (
              <button 
                className="action-btn primary"
                onClick={() => navigate(`/edit-project/${id}`)}
              >
                <span className="btn-icon">✏️</span>
                Edit Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card team">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.teamSize}</h3>
            <p>Team Size</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Project Progress</span>
          <span className="progress-percentage">{stats.completionPercentage}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <span className="tab-icon">👥</span>
          Team ({teamMembers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="tab-icon">📝</span>
          Tasks ({tasks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          <span className="tab-icon">🎯</span>
          Milestones ({milestones.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <span className="tab-icon">📁</span>
          Files ({files.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="info-card">
                <h3>Project Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Project Name:</span>
                    <span className="info-value">{projectData?.name || '--'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span 
                      className="info-value status"
                      style={{ color: getStatusColor(projectData?.status) }}
                    >
                      {projectData?.status || '--'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date:</span>
                    <span className="info-value">{formatDate(projectData?.start_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date:</span>
                    <span className="info-value">{formatDate(projectData?.end_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Budget:</span>
                    <span className="info-value">
                      {projectData?.budget ? `₹${parseInt(projectData.budget).toLocaleString('en-IN')}` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Project Statistics</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-circle total">
                      <span className="stat-number">{stats.totalTasks}</span>
                    </div>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-circle completed">
                      <span className="stat-number">{stats.completedTasks}</span>
                    </div>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-circle team">
                      <span className="stat-number">{stats.teamSize}</span>
                    </div>
                    <span className="stat-label">Team Size</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-tab">
            {teamMembers.length > 0 ? (
              <div className="team-grid">
                {teamMembers.map((member, index) => (
                  <div key={index} className="team-member-card">
                    <div className="member-avatar">
                      {getInitials(member.name || member.employee_name)}
                    </div>
                    <div className="member-info">
                      <h4 className="member-name">
                        {member.name || member.employee_name}
                      </h4>
                      <p className="member-role">
                        {member.designation || member.role || 'Team Member'}
                      </p>
                      <p className="member-email">
                        {member.employee_email || member.email || member.user?.email}
                      </p>
                    </div>
                    <div className="member-status active">
                      Active
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No team members</h4>
                <p>This project doesn't have any team members assigned yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            {tasks.length > 0 ? (
              <div className="tasks-list">
                {tasks.map((task, index) => (
                  <div key={index} className="task-card">
                    <div className="task-header">
                      <h4 className="task-title">{task.title || task.name}</h4>
                      <div className="task-badges">
                        {task.priority && (
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        )}
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    
                    
                    <div className="task-meta">
                      {task.assignee_name && (
                        <div className="task-assignee">
                          <div className="assignee-avatar">
                            {getInitials(task.assignee_name)}
                          </div>
                          <span className="assignee-name">{task.assignee_name}</span>
                        </div>
                      )}
                      
                      <div className="task-dates">
                        <span className="due-date">
                          Due: {formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No tasks</h4>
                <p>This project doesn't have any tasks yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-tab">
            {milestones.length > 0 ? (
              <div className="milestones-timeline">
                {milestones.map((milestone, index) => (
                  <div key={index} className="milestone-item">
                    <div className="milestone-marker">
                      <div 
                        className="milestone-dot"
                        style={{ backgroundColor: getStatusColor(milestone.status) }}
                      />
                    </div>
                    <div className="milestone-content">
                      <h4 className="milestone-title">{milestone.title || milestone.name}</h4>
                     
                      <div className="milestone-meta">
                        <span className="milestone-date">
                          {formatDate(milestone.due_date)}
                        </span>
                        <span 
                          className="milestone-status"
                          style={{ color: getStatusColor(milestone.status) }}
                        >
                          {milestone.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h4>No milestones</h4>
                <p>This project doesn't have any milestones yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="files-tab">
            {files.length > 0 ? (
              <div className="files-grid">
                {files.map((file, index) => (
                  <div key={index} className="file-card">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <h4 className="file-name">{file.name || file.filename}</h4>
                      <p className="file-meta">
                        {file.size && `${(file.size / 1024).toFixed(1)} KB`}
                        {file.uploaded_at && ` • ${formatDate(file.uploaded_at)}`}
                      </p>
                    </div>
                    <button 
                      className="file-download"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      ⬇️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h4>No files</h4>
                <p>This project doesn't have any files uploaded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
