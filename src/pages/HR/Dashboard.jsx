import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 5;

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    pendingLeaves: 0
  });
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0
  });
  const [birthdays, setBirthdays] = useState([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);

  // Modal state
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedManager: ""
  });

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch projects for stats
      const projectRes = await axiosInstance.post("/projects/list/", {
        page_size: 1000, // Get all for stats
        page: 1,
        search: ""
      });
      
      // Fetch employees for stats
      const employeeRes = await axiosInstance.post("/hr-management/employees/list/", {
        page_size: 1000,
        page: 1
      });

      // Fetch leave requests for stats
      const leaveRes = await axiosInstance.post("/hr-management/employees/leave-requests/list/", {
        page_size: 1000
      });

      if (projectRes.data.status) {
        const projects = projectRes.data.records || [];
        setStats(prev => ({
          ...prev,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'Ongoing').length
        }));
      }

      if (employeeRes.data.status) {
        setStats(prev => ({
          ...prev,
          totalEmployees: employeeRes.data.count || 0
        }));
      }

      if (leaveRes.data.status) {
        const leaves = leaveRes.data.records || [];
        setStats(prev => ({
          ...prev,
          pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
        }));
      }

      // Fetch attendance data
      const attendanceRes = await axiosInstance.post("/hr-management/attendance/summary/", {});
      if (attendanceRes.data.status) {
        setAttendance({
          present: attendanceRes.data.present || 0,
          absent: attendanceRes.data.absent || 0,
          total: attendanceRes.data.total || 0
        });
      }

      // Fetch today's birthdays
      const birthdayRes = await axiosInstance.post("/hr-management/employees/birthdays/today/", {});
      if (birthdayRes.data.status) {
        setBirthdays(birthdayRes.data.records || []);
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setStatsLoading(false);
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await axiosInstance.post("/projects/list/", {
        page_size: PAGE_SIZE,
        page: 1,
        search: ""
      });
      if (response.data.status) {
        setProjects(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
    setProjectsLoading(false);
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/list/", {
        page_size: PAGE_SIZE,
        page: 1
      });
      if (response.data.status) {
        setEmployees(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
    setEmployeesLoading(false);
  }, []);

  // Fetch leave requests
  const fetchLeaveRequests = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const response = await axiosInstance.post("/hr-management/employees/leave-requests/list/", {
        page_size: PAGE_SIZE,
        status: 'PENDING'
      });
      if (response.data.status) {
        setLeaveRequests(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
    setLeaveLoading(false);
  }, []);

  // Fetch managers for assignment
  const fetchManagers = useCallback(async () => {
    if (user.role === 'HR') {
      try {
        const response = await axiosInstance.post("/hr-management/manager/list/", {
          role: "MANAGER"
        });
        if (response.data.status) {
          setManagers(response.data.records || []);
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    }
  }, [user.role]);

  // Handle project assignment
  const handleAssignProject = async () => {
    if (!assignModal.selectedManager || !assignModal.projectId) return;
    
    try {
      const response = await axiosInstance.post("/projects/assign-manager/", {
        project_id: assignModal.projectId,
        manager_id: assignModal.selectedManager
      });
      
      if (response.data.status) {
        fetchProjects(); // Refresh projects list
        setAssignModal({ isOpen: false, projectId: null, selectedManager: "" });
      }
    } catch (error) {
      console.error("Error assigning project:", error);
    }
  };

  // Initialize dashboard data
  useEffect(() => {
    if (authLoading || !user) return;
    
    fetchStats();
    fetchProjects();
    fetchEmployees();
    fetchLeaveRequests();
    fetchManagers();
  }, [authLoading, user, fetchStats, fetchProjects, fetchEmployees, fetchLeaveRequests, fetchManagers]);

  if (authLoading || !user) {
    return (
      <div className="dashboard-container">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome back, {user.name}!</h1>
      
      {/* Metrics Cards */}
      <div className="metrics-row">
        <div className="metric-card">
          <h3>{statsLoading ? '--' : stats.totalProjects}</h3>
          <p>Total Projects</p>
        </div>
        <div className="metric-card">
          <h3>{statsLoading ? '--' : stats.activeProjects}</h3>
          <p>Active Projects</p>
        </div>
        <div className="metric-card">
          <h3>{statsLoading ? '--' : stats.totalEmployees}</h3>
          <p>Total Employees</p>
        </div>
        <div className="metric-card">
          <h3>{statsLoading ? '--' : stats.pendingLeaves}</h3>
          <p>Pending Leaves</p>
        </div>
        <div className="metric-card">
          <h3>{statsLoading ? '--' : attendance.present}</h3>
          <p>Present Today</p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Projects Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Projects</h2>
            <button onClick={() => navigate('/projects')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Manager</th>
                  <th>Status</th>
                  {user.role === 'HR' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {projectsLoading ? (
                  <tr>
                    <td colSpan={user.role === 'HR' ? 4 : 3} className="text-center">Loading...</td>
                  </tr>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.manager?.name || "Unassigned"}</td>
                      <td>
                        <span className={`status-badge ${project.status?.toLowerCase()}`}>
                          {project.status}
                        </span>
                      </td>
                      {user.role === 'HR' && (
                        <td>
                          {project.status === "Ongoing" ? (
                            <button
                              className="btn-approve"
                              onClick={() => setAssignModal({
                                isOpen: true,
                                projectId: project.id,
                                selectedManager: ""
                              })}
                            >
                              Assign
                            </button>
                          ) : (
                            <span className="text-muted">Closed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user.role === 'HR' ? 4 : 3} className="text-center">No projects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employees Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>All Employees</h2>
            <button onClick={() => navigate('/employee/list')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employeesLoading ? (
                  <tr>
                    <td colSpan="3" className="text-center">Loading...</td>
                  </tr>
                ) : employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.user?.name || employee.name}</td>
                      <td>{employee.user?.role || employee.role}</td>
                      <td>
                        <span className="status-badge active">Active</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Requests Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pending Leave Requests</h2>
            <button onClick={() => navigate('/leave-requests')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading...</td>
                  </tr>
                ) : leaveRequests.length > 0 ? (
                  leaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.employee_name}</td>
                      <td>{request.start_date}</td>
                      <td>{request.end_date}</td>
                      <td>{request.total_days}</td>
                      <td>
                        <span className={`status-badge ${request.status?.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No pending leave requests</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Birthdays Section */}
        {birthdays.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>🎉 Today's Birthdays</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {birthdays.map((person) => (
                    <tr key={person.id}>
                      <td>{person.name}</td>
                      <td>{person.department || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Manager</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
                ></button>
              </div>
              <div className="modal-body">
                <select
                  className="form-control"
                  value={assignModal.selectedManager}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, selectedManager: e.target.value }))}
                >
                  <option value="">Select Manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-reject"
                  onClick={() => setAssignModal({ isOpen: false, projectId: null, selectedManager: "" })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-approve"
                  onClick={handleAssignProject}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
