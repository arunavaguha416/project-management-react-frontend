import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import axiosInstance from "../../services/axiosinstance";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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
  const [errors, setErrors] = useState({
    userDetails: null,
    leaveRequests: null,
    attendance: null,
    projects: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    userDetails: true,
    leaveRequests: true,
    attendance: true,
    projects: true
  });

  // Project assignment modal state
  const [assignProjectModal, setAssignProjectModal] = useState({
    isOpen: false,
    selectedProject: "",
    isAssigning: false
  });

  useEffect(() => {
    fetchData();
    if (user.role === 'HR' || user.role === 'ADMIN') {
      fetchAvailableProjects();
    }
  }, [id, user.token]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch user details
    fetchUserDetails();
    
    // Fetch leave requests
    fetchLeaveRequests();
    
    // Fetch attendance records
    fetchAttendanceRecords();
    
    // Fetch projects
    fetchProjects();
  };

  const fetchAvailableProjects = async () => {
    try {
      const projectRes = await axiosInstance.post("/projects/list/", {
        page_size: 100, // Get more projects for assignment
        search: ""
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (projectRes.data.status) {
        // Filter out projects that are not ongoing
        const ongoingProjects = projectRes.data.records?.filter(p => p.status === 'Ongoing') || [];
        setAvailableProjects(ongoingProjects);
      }
    } catch (error) {
      console.error("Error fetching available projects:", error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const userResp = await axiosInstance.get(`/authentication/details/${id}/`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUserData(userResp.data.records);
      setErrors(prev => ({ ...prev, userDetails: null }));
    } catch (error) {
      console.error("Error fetching user details:", error);
      setErrors(prev => ({ ...prev, userDetails: "Failed to load user details" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, userDetails: false }));
      checkAllLoaded();
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const leaveResp = await axiosInstance.post(`/hr-management/employees/leave-requests/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const leaves = leaveResp.data.records || [];
      setLeaveRequests(leaves);
      
      // Calculate leave stats
      setStats(prev => ({
        ...prev,
        totalLeaves: leaves.length,
        approvedLeaves: leaves.filter(l => l.status === 'APPROVED').length,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length
      }));
      
      setErrors(prev => ({ ...prev, leaveRequests: null }));
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setErrors(prev => ({ ...prev, leaveRequests: "Failed to load leave requests" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, leaveRequests: false }));
      checkAllLoaded();
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const attendanceResp = await axiosInstance.post(`/hr-management/employee/attendance/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendanceRecords(attendanceResp.data.records || []);
      setErrors(prev => ({ ...prev, attendance: null }));
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setErrors(prev => ({ ...prev, attendance: "Failed to load attendance records" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, attendance: false }));
      checkAllLoaded();
    }
  };

  const fetchProjects = async () => {
    try {
      const projectResp = await axiosInstance.post(`/hr-management/employees/project/list/`, {
        employee_id: id,
        page_size: 10
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const userProjects = projectResp.data.records || [];
      setProjects(userProjects);
      setStats(prev => ({
        ...prev,
        totalProjects: userProjects.length
      }));
      setErrors(prev => ({ ...prev, projects: null }));
    } catch (error) {
      console.error("Error fetching projects:", error);
      setErrors(prev => ({ ...prev, projects: "Failed to load projects" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
      checkAllLoaded();
    }
  };

  const checkAllLoaded = () => {
    // Check if all API calls are completed
    setTimeout(() => {
      setLoadingStates(current => {
        const allLoaded = !Object.values(current).some(loading => loading);
        if (allLoaded) {
          setIsLoading(false);
        }
        return current;
      });
    }, 100);
  };

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
      // Call API to assign employee to project
      const response = await axiosInstance.post("/hr-management/employees/assign-project/", {
        employee_id: id,
        project_id: assignProjectModal.selectedProject
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (response.data.status) {
        alert("Employee assigned to project successfully!");
        setAssignProjectModal({ isOpen: false, selectedProject: "", isAssigning: false });
        // Refresh projects data
        fetchProjects();
      } else {
        alert("Failed to assign employee to project: " + response.data.message);
      }
    } catch (error) {
      console.error("Error assigning employee to project:", error);
      if (error.response?.data?.message) {
        alert("Error: " + error.response.data.message);
      } else {
        alert("Error assigning employee to project");
      }
    } finally {
      setAssignProjectModal(prev => ({ ...prev, isAssigning: false }));
    }
  };

  const closeAssignModal = () => {
    setAssignProjectModal({ isOpen: false, selectedProject: "", isAssigning: false });
  };

  // Get projects that the employee is NOT already assigned to
  const getUnassignedProjects = () => {
    const assignedProjectIds = projects.map(p => p.project_id || p.id);
    return availableProjects.filter(project => !assignedProjectIds.includes(project.id));
  };

  const ErrorMessage = ({ message, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <div className="ml-3">
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded h-4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-3/4"></div>
    </div>
  );

  // Show loading only for the first few seconds or if user details are still loading
  if (isLoading && loadingStates.userDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading user details...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Employee Details</h1>
                <p className="text-gray-600 mt-1">
                  Detailed information for {userData?.name || "Employee"}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Back to Dashboard
                </button>
                {(user.role === 'HR' || user.role === 'ADMIN') && (
                  <>
                    <button
                      onClick={handleAssignToProject}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Assign to Project
                    </button>
                    <button
                      onClick={() => navigate(`/edit-user/${id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit Employee
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Show general errors */}
            {errors.userDetails && (
              <div className="mt-4">
                <ErrorMessage 
                  message={errors.userDetails} 
                  onRetry={fetchUserDetails}
                />
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  {loadingStates.projects ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved Leaves</p>
                  {loadingStates.leaveRequests ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.approvedLeaves}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                  {loadingStates.leaveRequests ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingLeaves}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2-2V7a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-2V9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leaves</p>
                  {loadingStates.leaveRequests ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalLeaves}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
            
            {errors.userDetails ? (
              <ErrorMessage 
                message={errors.userDetails} 
                onRetry={fetchUserDetails}
              />
            ) : loadingStates.userDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <LoadingSpinner />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.name || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.email || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Role</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.role || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Designation</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.designation || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Salary</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {userData?.salary ? `$${userData.salary}` : "--"}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Department</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.department || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Company</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.company || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Joining Date</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.date_of_joining || "--"}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Date of Birth</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{userData?.date_of_birth || "--"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Assigned Projects</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{projects.length} projects</span>
                  {(user.role === 'HR' || user.role === 'ADMIN') && (
                    <button
                      onClick={handleAssignToProject}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      + Assign
                    </button>
                  )}
                </div>
              </div>

              {errors.projects ? (
                <ErrorMessage 
                  message={errors.projects} 
                  onRetry={fetchProjects}
                />
              ) : loadingStates.projects ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.length > 0 ? (
                        projects.map((project, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/project/details/${project.project_id || project.id}`)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {project.project_name || project.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (project.project_status || project.status) === "Ongoing" 
                                  ? "bg-green-100 text-green-800"
                                  : (project.project_status || project.status) === "Completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {project.project_status || project.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.role || "Team Member"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                            No projects assigned
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Leave Requests Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Leave Requests</h2>
                <span className="text-sm text-gray-500">{leaveRequests.length} requests</span>
              </div>

              {errors.leaveRequests ? (
                <ErrorMessage 
                  message={errors.leaveRequests} 
                  onRetry={fetchLeaveRequests}
                />
              ) : loadingStates.leaveRequests ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaveRequests.length > 0 ? (
                        leaveRequests.map((leave, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {leave.start_date}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {leave.end_date}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                leave.status === 'APPROVED' 
                                  ? 'bg-green-100 text-green-800'
                                  : leave.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                            No leave requests
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Recent Attendance Records</h2>
              <span className="text-sm text-gray-500">{attendanceRecords.length} records</span>
            </div>

            {errors.attendance ? (
              <ErrorMessage 
                message={errors.attendance} 
                onRetry={fetchAttendanceRecords}
              />
            ) : loadingStates.attendance ? (
              <div className="space-y-2">
                <LoadingSpinner />
                <LoadingSpinner />
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours Worked
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.date}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.check_in || "--"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.check_out || "--"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.hours_worked || "--"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'PRESENT' 
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'ABSENT'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status || 'PRESENT'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                          No attendance records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign to Project Modal */}
      {assignProjectModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Employee to Project
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project
                </label>
                <select
                  value={assignProjectModal.selectedProject}
                  onChange={(e) => setAssignProjectModal({
                    ...assignProjectModal,
                    selectedProject: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={assignProjectModal.isAssigning}
                >
                  <option value="">Choose a project...</option>
                  {getUnassignedProjects().map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {getUnassignedProjects().length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No available projects to assign. Employee is already assigned to all ongoing projects.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeAssignModal}
                  disabled={assignProjectModal.isAssigning}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignProjectSubmit}
                  disabled={assignProjectModal.isAssigning || !assignProjectModal.selectedProject}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignProjectModal.isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
