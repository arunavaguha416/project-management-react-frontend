import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../services/axiosinstance";
import { AuthContext } from "../context/auth-context";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0
  });
  const [birthdays, setBirthdays] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    pendingLeaves: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedManager: ""
  });

  // Pagination states
  const [projectPagination, setProjectPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
    totalCount: 0
  });
  const [employeePagination, setEmployeePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
    totalCount: 0
  });

  const navigate = useNavigate();

  // Separate function to fetch projects only
  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const response = await axiosInstance.post("/projects/list/", {
        page_size: projectPagination.pageSize,
        page: projectPagination.currentPage,
        search: ""
      });

      if (response.data.status) {
        setProjects(response.data.records || []);
        setProjectPagination(prev => ({
          ...prev,
          totalCount: response.data.count || 0,
          totalPages: response.data.num_pages || 1,
          currentPage: response.data.current_page || 1
        }));
        
        // Update stats only if this is the first load (page 1)
        if (projectPagination.currentPage === 1) {
          setStats(prev => ({
            ...prev,
            totalProjects: response.data.count || 0,
            activeProjects: response.data.records?.filter(p => p.status === 'Ongoing').length || 0
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectPagination.currentPage, projectPagination.pageSize]);

  // Separate function to fetch employees only
  const fetchEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const response = await axiosInstance.post("/hr-management/employees/list/", {
        page_size: employeePagination.pageSize,
        page: employeePagination.currentPage
      });

      if (response.data.status) {
        setEmployees(response.data.records || []);
        setEmployeePagination(prev => ({
          ...prev,
          totalCount: response.data.count || 0,
          totalPages: response.data.num_pages || 1,
          currentPage: response.data.current_page || 1
        }));

        // Update stats only if this is the first load (page 1)
        if (employeePagination.currentPage === 1) {
          setStats(prev => ({
            ...prev,
            totalEmployees: response.data.count || 0
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  }, [employeePagination.currentPage, employeePagination.pageSize]);

  // Initial data fetch (non-paginated data)
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch managers for assignment dropdown (only for HR)
      if (user.role === 'HR') {
        const managerRes = await axiosInstance.post("/hr-management/manager/list/", {
          role: "MANAGER"
        });
        if (managerRes.data.status) {
          setManagers(managerRes.data.records || []);
        }
      }

      // Fetch leave requests
      const leaveRes = await axiosInstance.post("/hr-management/employees/leave-requests/list/", {
        page_size: 5
      });
      if (leaveRes.data.status) {
        setLeaveRequests(leaveRes.data.records || []);
        setStats(prev => ({
          ...prev,
          pendingLeaves: leaveRes.data.records?.filter(l => l.status === 'PENDING').length || 0
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
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.role]);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch projects when project pagination changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch employees when employee pagination changes
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Pagination handlers
  const handleProjectPageChange = (page) => {
    setProjectPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleEmployeePageChange = (page) => {
    setEmployeePagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Optimized Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemName, totalCount, pageSize, isLoading = false }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 3;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 2) {
          for (let i = 1; i <= 3; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 1) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 2; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          pages.push(currentPage);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    if (totalCount === 0) return null;

    return (
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {isLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <>
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalCount}</span> {itemName}
              </>
            )}
          </div>
          
          {totalPages > 1 && (
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={index} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => onPageChange(page)}
                    disabled={isLoading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </div>
    );
  };

  const handleAssignProject = (projectId) => {
    setAssignModal({
      isOpen: true,
      projectId: projectId,
      selectedManager: ""
    });
  };

  const handleAssignSubmit = async () => {
    if (!assignModal.selectedManager) {
      alert("Please select a manager");
      return;
    }

    try {
      const response = await axiosInstance.put("/projects/assign-manager/", {
        id: assignModal.projectId,
        manager_id: assignModal.selectedManager
      });

      if (response.data.status) {
        alert("Project assigned successfully!");
        setAssignModal({ isOpen: false, projectId: null, selectedManager: "" });
        fetchProjects(); // Only refresh projects data
      } else {
        alert("Failed to assign project: " + response.data.message);
      }
    } catch (error) {
      console.error("Error assigning project:", error);
      alert("Error assigning project");
    }
  };

  const closeModal = () => {
    setAssignModal({ isOpen: false, projectId: null, selectedManager: "" });
  };

  const navigateToUserDetails = (userId) => {
    navigate(`/user/details/${userId}`);
  };

  const navigateToProjectDetails = (projectId) => {
    navigate(`/project/details/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-loading">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
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
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
              </div>
              <div className="flex space-x-3">
                {(user.role === 'ADMIN' || user.role === 'HR') && (
                  <>
                    <button
                      onClick={() => navigate("/add-user")}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add User
                    </button>
                    <button
                      onClick={() => navigate("/add-project")}
                      className="btn-jira text-white px-4 py-2 rounded-md "
                    >
                      Add Project
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.121-4.657a4 4 0 110-5.292" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingLeaves}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Present Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{attendance.present}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Attendance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Present</p>
                    <p className="text-2xl font-bold text-green-700">{attendance.present}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Absent</p>
                    <p className="text-2xl font-bold text-red-700">{attendance.absent}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-700">{attendance.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.121-4.657a4 4 0 110-5.292" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects List with Optimized Pagination */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Projects</h2>
                  <button
                    onClick={() => navigate("/projects/list")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                {projectsLoading ? (
                  <div className="text-center p-8">
                    <div className="inline-flex items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading projects...
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manager
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {user.role === 'HR' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <tr 
                            key={project.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigateToProjectDetails(project.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {project.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.manager?.name || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                project.status === "Ongoing"
                                  ? "bg-green-100 text-green-800"
                                  : project.status === "Completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {project.status}
                              </span>
                            </td>
                            {user.role === 'HR' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {project.status === "Ongoing" ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignProject(project.id);
                                    }}
                                    className="btn-jira text-white px-3 py-1 rounded-md "
                                  >
                                    Assign Manager
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">Closed</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={user.role === 'HR' ? "4" : "3"} className="px-6 py-4 text-center text-gray-500">
                            No projects found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <Pagination 
                currentPage={projectPagination.currentPage}
                totalPages={projectPagination.totalPages}
                onPageChange={handleProjectPageChange}
                itemName="projects"
                totalCount={projectPagination.totalCount}
                pageSize={projectPagination.pageSize}
                isLoading={projectsLoading}
              />
            </div>

            {/* Employees List with Optimized Pagination */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Employees</h2>
                  <button
                    onClick={() => navigate("/employee/list")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                {employeesLoading ? (
                  <div className="text-center p-8">
                    <div className="inline-flex items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading employees...
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.length > 0 ? (
                        employees.map((employee) => (
                          <tr 
                            key={employee.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigateToUserDetails(employee.user?.id || employee.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {employee.user?.name?.charAt(0) || employee.name?.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {employee.user?.name || employee.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.user?.role || employee.role}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                            No employees found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <Pagination 
                currentPage={employeePagination.currentPage}
                totalPages={employeePagination.totalPages}
                onPageChange={handleEmployeePageChange}
                itemName="employees"
                totalCount={employeePagination.totalCount}
                pageSize={employeePagination.pageSize}
                isLoading={employeesLoading}
              />
            </div>
          </div>

          {/* Birthday and Leave Requests Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Birthday Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Today's Birthdays 🎉</h2>
                <span className="text-sm text-gray-500">{birthdays.length} birthdays</span>
              </div>

              <div className="space-y-4">
                {birthdays.length > 0 ? (
                  birthdays.map((birthday, index) => (
                    <div key={index} className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-pink-600">
                          🎂
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {birthday.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {birthday.designation || birthday.role}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">🎈</div>
                    <div>No birthdays today</div>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Requests - Only show for HR/ADMIN */}
            {(user.role === 'HR' || user.role === 'ADMIN') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Pending Leave Requests</h2>
                  <button
                    onClick={() => navigate("/leave-requests")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaveRequests.length > 0 ? (
                        leaveRequests.map((leave) => (
                          <tr key={leave.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {leave.employee_name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {leave.start_date}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {leave.end_date}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {leave.reason}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                leave.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : leave.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                            No pending leave requests
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(user.role !== 'HR' && user.role !== 'ADMIN') && (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Project Manager
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Manager
                </label>
                <select
                  value={assignModal.selectedManager}
                  onChange={(e) => setAssignModal({
                    ...assignModal,
                    selectedManager: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a manager...</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
