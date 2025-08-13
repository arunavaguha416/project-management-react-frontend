import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';
import { useNavigate } from "react-router-dom";

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
        '/projects/manager/team-members/',
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
        { request_id: requestId, action: action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.data.status) {
        fetchLeaveRequests(); // Refresh list
        fetchMetrics(); // Update metrics
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

  if (authLoading || !user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Project Manager Dashboard</h1>
      
      {/* Metrics Cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <h3>{metricsLoading ? '--' : metrics.total_projects}</h3>
          <p>Total Projects</p>
        </div>
        <div className="metric-card">
          <h3>{metricsLoading ? '--' : metrics.active_projects}</h3>
          <p>Active Projects</p>
        </div>
        <div className="metric-card">
          <h3>{metricsLoading ? '--' : metrics.team_size}</h3>
          <p>Team Members</p>
        </div>
        <div className="metric-card">
          <h3>{metricsLoading ? '--' : metrics.pending_leaves}</h3>
          <p>Pending Leaves</p>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Team Members Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Team Members</h2>
            <button onClick={() => navigate('/team-management')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Current Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamLoading ? (
                  <tr><td colSpan="4">Loading...</td></tr>
                ) : teamMembers.length > 0 ? (
                  teamMembers.map(member => (
                    <tr key={member.id}>
                      <td>{member.name || '--'}</td>
                      <td>{member.designation || '--'}</td>
                      <td>{member.current_project || '--'}</td>
                      <td>
                        <span className={`status-badge ${member.status?.toLowerCase()}`}>
                          {member.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4">No team members found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Approval Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pending Leave Requests</h2>
            <button onClick={() => navigate('/leave-management')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveLoading ? (
                  <tr><td colSpan="5">Loading...</td></tr>
                ) : leaveRequests.length > 0 ? (
                  leaveRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.employee_name}</td>
                      <td>{request.start_date}</td>
                      <td>{request.end_date}</td>
                      <td>{request.total_days}</td>
                      <td>
                        <button 
                          className="btn-approve"
                          onClick={() => handleLeaveAction(request.id, 'APPROVED')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => handleLeaveAction(request.id, 'REJECTED')}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5">No pending leave requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Managed Projects Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Managed Projects</h2>
            <button onClick={() => navigate('/project-management')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Team Size</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projectsLoading ? (
                  <tr><td colSpan="4">Loading...</td></tr>
                ) : managedProjects.length > 0 ? (
                  managedProjects.map(project => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.team_size || 0}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{width: `${project.progress || 0}%`}}
                          ></div>
                          <span>{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${project.status?.toLowerCase()}`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4">No projects found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="dashboard-section quick-actions">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="action-buttons">
            <button onClick={() => navigate('/add-project')}>
              + New Project
            </button>
            <button onClick={() => navigate('/team/assign')}>
              Assign Tasks
            </button>
            <button onClick={() => navigate('/reports')}>
              View Reports
            </button>
            <button onClick={() => navigate('/team/performance')}>
              Team Performance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
