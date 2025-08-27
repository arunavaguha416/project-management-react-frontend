import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import "../../assets/css/EmployeeList.css";

const EmployeeList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0
  });

  // Summary stats
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    hr: 0,
    managers: 0,
    employees: 0
  });

  // Optimized fetch function with pagination loading state
  const fetchEmployees = useCallback(
    async (isPagination = false) => {
      try {
        if (isPagination) {
          setPaginationLoading(true);
        } else {
          setIsLoading(true);
        }
        
        const response = await axiosInstance.post(
          "/hr-management/employees/list/",
          {
            page_size: pagination.pageSize,
            page: pagination.currentPage,
            search: searchQuery,
            role: roleFilter
          }
        );
        
        if (response.data.status) {
          const employeeData = response.data.records || [];
          setEmployees(employeeData);
          setPagination(prev => ({
            ...prev,
            totalCount: response.data.count || 0,
            totalPages: response.data.num_pages || 1,
            currentPage: response.data.current_page || 1
          }));

          // Calculate stats
          setEmployeeStats({
            total: response.data.count || 0,
            hr: employeeData.filter(emp => (emp.user?.role || emp.role) === 'HR').length,
            managers: employeeData.filter(emp => (emp.user?.role || emp.role) === 'MANAGER').length,
            employees: employeeData.filter(emp => (emp.user?.role || emp.role) === 'USER').length
          });
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        if (isPagination) {
          setPaginationLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [pagination.currentPage, pagination.pageSize, searchQuery, roleFilter]
  );

  // Initial load
  useEffect(() => {
    fetchEmployees(false);
  }, [fetchEmployees]);

  const handlePageChange = page => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    setTimeout(() => fetchEmployees(true), 0);
  };

  const handleSearch = e => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchEmployees(false);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role) => {
    const colors = {
      'HR': '#e91e63',
      'MANAGER': '#ff9800',
      'USER': '#4caf50'
    };
    return colors[role] || '#757575';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary) return '--';
    return `₹${parseInt(salary).toLocaleString('en-IN')}`;
  };

  const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, pageSize, isLoading = false }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(totalPages);
        }
      }
      return pages;
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    if (totalCount === 0) return null;

    return (
      <div className={`pagination-container ${isLoading ? 'loading' : ''}`}>
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {totalCount} employees
        </div>
        
        <div className="pagination">
          <button
            className="page-btn prev"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            ← Previous
          </button>

          <div className="page-numbers">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`page-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...' || isLoading}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="page-btn next"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="employee-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="employee-list-container">
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

      {/* Header */}
      <div className="employee-list-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Employee Directory</h1>
            <p className="page-subtitle">Manage your team members and their information</p>
          </div>
          
          {user.role === "HR" && (
            <div className="header-actions">
              <button 
                className="action-btn primary"
                onClick={() => navigate('/add-user')}
              >
                <span className="btn-icon">👤</span>
                Add Employee
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{employeeStats.total}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card hr">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{employeeStats.hr}</h3>
            <p>HR Staff</p>
          </div>
        </div>
        <div className="stat-card managers">
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <h3>{employeeStats.managers}</h3>
            <p>Managers</p>
          </div>
        </div>
        <div className="stat-card employees">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>{employeeStats.employees}</h3>
            <p>Employees</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>

        <div className="role-filters">
          <button
            className={`filter-btn ${roleFilter === "" ? "active" : ""}`}
            onClick={() => handleRoleFilter("")}
          >
            All Roles
          </button>
          <button
            className={`filter-btn ${roleFilter === "HR" ? "active" : ""}`}
            onClick={() => handleRoleFilter("HR")}
          >
            🏢 HR
          </button>
          <button
            className={`filter-btn ${roleFilter === "MANAGER" ? "active" : ""}`}
            onClick={() => handleRoleFilter("MANAGER")}
          >
            👨‍💼 Managers
          </button>
          <button
            className={`filter-btn ${roleFilter === "USER" ? "active" : ""}`}
            onClick={() => handleRoleFilter("USER")}
          >
            👤 Employees
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="employees-section">
        {employees.length > 0 ? (
          <div className="employees-table-container">
            <div className="employees-table">
              <div className="table-header">
                <div className="header-cell employee-col">Employee</div>
                <div className="header-cell role-col">Role</div>
                <div className="header-cell designation-col">Designation</div>
                {user.role === "HR" && (
                  <>
                    <div className="header-cell salary-col">Salary</div>
                    <div className="header-cell date-col">Joining Date</div>
                    <div className="header-cell date-col">Date of Birth</div>
                  </>
                )}
                <div className="header-cell status-col">Status</div>
                {user.role === "HR" && (
                  <div className="header-cell actions-col">Actions</div>
                )}
              </div>

              <div className="table-body">
                {employees.map((employee) => (
                  <div key={employee.id} className="table-row">
                    <div className="table-cell employee-col">
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {getInitials(employee.user?.name || employee.name)}
                        </div>
                        <div className="employee-details">
                          <div className="employee-name">
                            {employee.user?.name || employee.name}
                          </div>
                          <div className="employee-username">
                            @{employee.user?.username || employee.username}
                          </div>
                          <div className="employee-email">
                            {employee.user?.email || employee.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="table-cell role-col">
                      <span 
                        className="role-badge"
                        style={{ backgroundColor: getRoleColor(employee.user?.role || employee.role) }}
                      >
                        {employee.user?.role || employee.role}
                      </span>
                    </div>

                    <div className="table-cell designation-col">
                      {employee.designation || '--'}
                    </div>

                    {user.role === "HR" && (
                      <>
                        <div className="table-cell salary-col">
                          {formatSalary(employee.salary)}
                        </div>
                        <div className="table-cell date-col">
                          {formatDate(employee.date_of_joining)}
                        </div>
                        <div className="table-cell date-col">
                          {formatDate(employee.user?.date_of_birth)}
                        </div>
                      </>
                    )}

                    <div className="table-cell status-col">
                      <span className="status-badge active">Active</span>
                    </div>

                    {user.role === "HR" && (
                      <div className="table-cell actions-col">
                        <button
                          className="action-btn-small view"
                          onClick={() => navigate(`/user-details/${employee.user?.id || employee.id}`)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn-small edit"
                          onClick={() => navigate(`/edit-user/${employee.user?.id || employee.id}`)}
                          title="Edit Employee"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No employees found</h3>
            <p>
              {searchQuery || roleFilter 
                ? "Try adjusting your search or filters" 
                : "No employees available at the moment"}
            </p>
            {user.role === "HR" && !searchQuery && !roleFilter && (
              <button 
                className="create-btn"
                onClick={() => navigate('/add-user')}
              >
                Add Your First Employee
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        totalCount={pagination.totalCount}
        pageSize={pagination.pageSize}
        isLoading={paginationLoading}
      />
    </div>
  );
};

export default EmployeeList;
