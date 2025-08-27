import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import axiosInstance from "../../services/axiosinstance";
import "../../assets/css/UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State management
  const [userData, setUserData] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [projects, setProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    totalProjects: 0
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [assignProjectModal, setAssignProjectModal] = useState({
    isOpen: false,
    selectedProject: "",
    isAssigning: false
  });

  // Utility functions
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = {
      'APPROVED': '#4caf50',
      'PENDING': '#ff9800',
      'REJECTED': '#f44336',
      'PRESENT': '#4caf50',
      'ABSENT': '#f44336',
      'Ongoing': '#4caf50',
      'Completed': '#2196f3',
      'On Hold': '#ff9800'
    };
    return colors[status] || '#757575';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Individual fetch functions (wrapped in useCallback)
  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/authentication/details/${id}/`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUserData(response.data.records);
    } catch (error) {
      console.error("Failed to load user details:", error);
    }
  }, [id, user.token]);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/hr-management/employees/leave-requests/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const leaves = response.data.records || [];
      setLeaveRequests(leaves);
      setStats(prev => ({
        ...prev,
        totalLeaves: leaves.length,
        approvedLeaves: leaves.filter(l => l.status === 'APPROVED').length,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
      }));
    } catch (error) {
      console.error("Failed to load leave requests:", error);
    }
  }, [id, user.token]);

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/hr-management/employee/attendance/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendanceRecords(response.data.records || []);
    } catch (error) {
      console.error("Failed to load attendance records:", error);
    }
  }, [id, user.token]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/hr-management/employees/project/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const userProjects = response.data.records || [];
      setProjects(userProjects);
      setStats(prev => ({ ...prev, totalProjects: userProjects.length }));
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, [id, user.token]);

  const fetchAvailableProjects = useCallback(async () => {
    try {
      const response = await axiosInstance.post("/projects/list/", {
        page_size: 100,
        search: ""
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (response.data.status) {
        const ongoingProjects = response.data.records?.filter(p => p.status === 'Ongoing') || [];
        setAvailableProjects(ongoingProjects);
      }
    } catch (error) {
      console.error("Error fetching available projects:", error);
    }
  }, [user.token]);

  // Main data fetching function (wrapped in useCallback)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUserDetails(),
        fetchLeaveRequests(),
        fetchAttendanceRecords(),
        fetchProjects()
      ]);

      if (user.role === 'HR' || user.role === 'ADMIN') {
        await fetchAvailableProjects();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails, fetchLeaveRequests, fetchAttendanceRecords, fetchProjects, fetchAvailableProjects, user.role]);

  // Project assignment functions
  const handleAssignToProject = () => {
    setAssignProjectModal({
      isOpen: true,
      selectedProject: "",
      isAssigning: false
    });
  };

  const handleAssignProjectSubmit = async () => {
    if (!assignProjectModal.selectedProject) {
      alert("Please select a project");
      return;
    }

    setAssignProjectModal(prev => ({ ...prev, isAssigning: true }));
    
    try {
      const response = await axiosInstance.post("/hr-management/employees/assign-project/", {
        employee_id: id,
        project_id: assignProjectModal.selectedProject
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (response.data.status) {
        alert("Employee assigned to project successfully!");
        closeAssignModal();
        fetchProjects();
      } else {
        alert("Failed to assign employee to project: " + response.data.message);
      }
    } catch (error) {
      console.error("Error assigning employee to project:", error);
      alert("Error assigning employee to project");
    } finally {
      setAssignProjectModal(prev => ({ ...prev, isAssigning: false }));
    }
  };

  const closeAssignModal = () => {
    setAssignProjectModal({
      isOpen: false,
      selectedProject: "",
      isAssigning: false
    });
  };

  const getUnassignedProjects = () => {
    const assignedProjectIds = projects.map(p => p.project_id || p.id);
    return availableProjects.filter(project => !assignedProjectIds.includes(project.id));
  };

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="user-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="user-details-container">
      {/* Enhanced Back Button */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          title="Go back to previous page"
        >
          <span className="back-icon">←</span>
          <span className="back-text">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="user-details-header">
        <div className="header-content">
          <div className="user-profile">
            <div className="user-avatar large">
              {getInitials(userData?.name)}
            </div>
            <div className="user-info">
              <h1 className="user-name">{userData?.name || "Employee"}</h1>
              <p className="user-title">{userData?.designation || "No designation"}</p>
              <div className="user-meta">
                <span className="user-email">{userData?.email}</span>
                <span className="user-role">{userData?.role}</span>
              </div>
            </div>
          </div>

          {(user.role === 'HR' || user.role === 'ADMIN') && (
            <div className="header-actions">
              <button 
                className="action-btn primary"
                onClick={handleAssignToProject}
              >
                <span className="btn-icon">➕</span>
                Assign Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedLeaves}</h3>
            <p>Approved Leaves</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalLeaves}</h3>
            <p>Total Leaves</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">👤</span>
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <span className="tab-icon">📊</span>
          Projects
        </button>
        <button 
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <span className="tab-icon">📅</span>
          Leave History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <span className="tab-icon">⏰</span>
          Attendance
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="info-card">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <span>{userData?.name || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{userData?.email || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Date of Birth</label>
                    <span>{formatDate(userData?.date_of_birth)}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <span>{userData?.phone || '--'}</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Work Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Designation</label>
                    <span>{userData?.designation || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Department</label>
                    <span>{userData?.department_name || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Company</label>
                    <span>{userData?.company_name || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Joining Date</label>
                    <span>{formatDate(userData?.date_of_joining)}</span>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <span className="role-badge">{userData?.role || '--'}</span>
                  </div>
                  <div className="info-item">
                    <label>Salary</label>
                    <span>{userData?.salary ? `$${userData.salary.toLocaleString()}` : '--'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-tab">
            <div className="projects-list">
              {projects.length > 0 ? (
                projects.map((project, index) => (
                  <div key={index} className="project-card">
                    <div className="project-info">
                      <h4 className="project-name">
                        {project.project_name || project.name}
                      </h4>
                      <p className="project-role">{project.role || "Team Member"}</p>
                    </div>
                    <div className="project-meta">
                      <div 
                        className="project-status"
                        style={{ color: getStatusColor(project.project_status || project.status) }}
                      >
                        {project.project_status || project.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h4>No projects assigned</h4>
                  <p>This employee is not currently assigned to any projects</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="leaves-tab">
            <div className="leaves-list">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((leave, index) => (
                  <div key={index} className="leave-card">
                    <div className="leave-dates">
                      <div className="date-range">
                        <span className="start-date">{formatDate(leave.start_date)}</span>
                        <span className="date-separator">→</span>
                        <span className="end-date">{formatDate(leave.end_date)}</span>
                      </div>
                      <span className="leave-duration">
                        {leave.total_days || 1} day{(leave.total_days || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="leave-info">
                      <p className="leave-reason">{leave.reason || 'No reason provided'}</p>
                    </div>
                    <div 
                      className="leave-status"
                      style={{ color: getStatusColor(leave.status) }}
                    >
                      {leave.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h4>No leave requests</h4>
                  <p>This employee hasn't submitted any leave requests yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="attendance-tab">
            <div className="attendance-list">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record, index) => (
                  <div key={index} className="attendance-card">
                    <div className="attendance-date">
                      <span className="date">{formatDate(record.date)}</span>
                      <span 
                        className="attendance-status"
                        style={{ color: getStatusColor(record.status) }}
                      >
                        {record.status || 'PRESENT'}
                      </span>
                    </div>
                    <div className="attendance-times">
                      <div className="time-item">
                        <label>Check In</label>
                        <span>{record.check_in || '--'}</span>
                      </div>
                      <div className="time-item">
                        <label>Check Out</label>
                        <span>{record.check_out || '--'}</span>
                      </div>
                      <div className="time-item">
                        <label>Hours</label>
                        <span>{record.hours_worked || '--'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <h4>No attendance records</h4>
                  <p>No attendance data available for this employee</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Project Modal */}
      {assignProjectModal.isOpen && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Project</h3>
              <button className="modal-close" onClick={closeAssignModal}>×</button>
            </div>
            <div className="modal-body">
              {getUnassignedProjects().length > 0 ? (
                <div className="form-group">
                  <label>Select Project</label>
                  <select
                    value={assignProjectModal.selectedProject}
                    onChange={(e) => setAssignProjectModal(prev => ({
                      ...prev,
                      selectedProject: e.target.value
                    }))}
                    className="form-select"
                  >
                    <option value="">Choose a project...</option>
                    {getUnassignedProjects().map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="no-projects">
                  <p>No available projects to assign. Employee is already assigned to all ongoing projects.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeAssignModal}>
                Cancel
              </button>
              {getUnassignedProjects().length > 0 && (
                <button 
                  className="btn primary"
                  onClick={handleAssignProjectSubmit}
                  disabled={assignProjectModal.isAssigning || !assignProjectModal.selectedProject}
                >
                  {assignProjectModal.isAssigning ? 'Assigning...' : 'Assign Project'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
