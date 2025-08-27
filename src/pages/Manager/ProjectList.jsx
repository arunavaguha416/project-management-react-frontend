import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import "../../assets/css/ProjectList.css";

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0
  });

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    pending: 0
  });

  const apiEndpoint = user.role === "HR" ? "/projects/list/" : "/projects/manager/list/";

  const fetchProjects = useCallback(async (isPagination = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setIsLoading(true);
      }
      
      const res = await axiosInstance.post(apiEndpoint, {
        page_size: pagination.pageSize,
        page: pagination.currentPage,
        search: searchQuery,
        status: statusFilter
      });
      
      if (res.data.status) {
        const projectData = res.data.records || [];
        setProjects(projectData);
        setPagination(prev => ({
          ...prev,
          totalCount: res.data.count || 0,
          totalPages: res.data.num_pages || 1,
          currentPage: res.data.current_page || 1
        }));

        // Calculate summary stats
        setSummaryStats({
          total: res.data.count || 0,
          ongoing: projectData.filter(p => p.status === 'Ongoing').length,
          completed: projectData.filter(p => p.status === 'Completed').length,
          pending: projectData.filter(p => p.status === 'Pending').length
        });
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      if (isPagination) {
        setPaginationLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [apiEndpoint, pagination.currentPage, pagination.pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects]);

  const handlePageChange = page => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    setTimeout(() => fetchProjects(true), 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProjects(false);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ongoing': return '🚀';
      case 'Completed': return '✅';
      case 'Pending': return '⏳';
      case 'On Hold': return '⏸️';
      default: return '📋';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#4caf50',
      'Completed': '#2196f3',
      'Pending': '#ff9800',
      'On Hold': '#f44336'
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
          Showing {startItem} to {endItem} of {totalCount} projects
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
      <div className="project-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="project-list-container">
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
      <div className="project-list-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">
              {user.role === "HR" ? "All Projects" : "My Projects"}
            </h1>
            <p className="page-subtitle">
              {user.role === "HR" 
                ? "Manage and track all your projects" 
                : "Projects you're managing"}
            </p>
          </div>
          
          <div className="header-actions">
            {/* Sprint Board Button - Corrected Text */}
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/sprint-board')}
              title="Go to Sprint Board"
            >
              <span className="btn-icon">📊</span>
              Sprint Board
            </button>
            
            {/* New Project Button - Only for HR */}
            {user.role === "HR" && (
              <button 
                className="action-btn primary"
                onClick={() => navigate('/add-project')}
                title="Create New Project"
              >
                <span className="btn-icon">➕</span>
                New Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{summaryStats.total}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card ongoing">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{summaryStats.ongoing}</h3>
            <p>Ongoing</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{summaryStats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{summaryStats.pending}</h3>
            <p>Pending</p>
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
                placeholder="Search projects..."
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

        <div className="status-filters">
          <button
            className={`filter-btn ${statusFilter === "" ? "active" : ""}`}
            onClick={() => handleStatusFilter("")}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "Ongoing" ? "active" : ""}`}
            onClick={() => handleStatusFilter("Ongoing")}
          >
            🚀 Ongoing
          </button>
          <button
            className={`filter-btn ${statusFilter === "Completed" ? "active" : ""}`}
            onClick={() => handleStatusFilter("Completed")}
          >
            ✅ Completed
          </button>
          <button
            className={`filter-btn ${statusFilter === "Pending" ? "active" : ""}`}
            onClick={() => handleStatusFilter("Pending")}
          >
            ⏳ Pending
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="projects-section">
        {projects.length > 0 ? (
          <div className="projects-table-container">
            <div className="projects-table">
              <div className="table-header">
                <div className="header-cell project-col">Project</div>
                <div className="header-cell status-col">Status</div>
                <div className="header-cell manager-col">Manager</div>
                <div className="header-cell dates-col">Timeline</div>
                <div className="header-cell progress-col">Progress</div>
                <div className="header-cell actions-col">Actions</div>
              </div>

              <div className="table-body">
                {projects.map((project) => (
                  <div key={project.id} className="table-row">
                    <div className="table-cell project-col">
                      <div className="project-info">
                        <div className="project-icon-wrapper">
                          <span className="project-icon">
                            {getStatusIcon(project.status)}
                          </span>
                        </div>
                        <div className="project-details">
                          <div className="project-name">
                            {project.name}
                          </div>
                          <div className="project-description">
                            {project.description || 'No description available'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="table-cell status-col">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="table-cell manager-col">
                      {project.manager ? (
                        <div className="manager-info">
                          <div className="manager-avatar">
                            {getInitials(project.manager.name)}
                          </div>
                          <div className="manager-details">
                            <span className="manager-name">{project.manager.name}</span>
                            <span className="manager-role">Manager</span>
                          </div>
                        </div>
                      ) : (
                        <span className="no-manager">Unassigned</span>
                      )}
                    </div>

                    <div className="table-cell dates-col">
                      <div className="date-range">
                        <div className="date-item">
                          <span className="date-label">Start:</span>
                          <span className="date-value">{formatDate(project.start_date)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">End:</span>
                          <span className="date-value">{formatDate(project.end_date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="table-cell progress-col">
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${project.completion_percentage || 0}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {project.completion_percentage || 0}%
                        </span>
                      </div>
                    </div>

                    <div className="table-cell actions-col">
                      <div className="action-buttons-group">
                        <button
                          className="action-btn-small view"
                          onClick={() => navigate(`/project-details/${project.id}`)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn-small sprint"
                          onClick={() => navigate(`/sprint-board/${project.id}`)}
                          title="Sprint Board"
                        >
                          📋
                        </button>
                        {user.role === "HR" && (
                          <button
                            className="action-btn-small edit"
                            onClick={() => navigate(`/edit-project/${project.id}`)}
                            title="Edit Project"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No projects found</h3>
            <p>
              {searchQuery || statusFilter 
                ? "Try adjusting your search or filters" 
                : "No projects available at the moment"}
            </p>
            {user.role === "HR" && !searchQuery && !statusFilter && (
              <button 
                className="create-btn"
                onClick={() => navigate('/add-project')}
              >
                Create Your First Project
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

export default ProjectList;
