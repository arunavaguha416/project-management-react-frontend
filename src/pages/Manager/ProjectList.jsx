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

  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    pending: 0
  });

  const apiEndpoint = user.role === "HR" ? "/projects/list/" : "/projects/manager/list/";

  const handleProjectClick = (projectId) => {
    navigate(`/project-details/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate('/add-project');
  };

  const handleEditProject = (projectId, e) => {
    e.stopPropagation();
    navigate(`/edit-project/${projectId}`);
  };

   const handleSprint = (projectId, e) => {
    e.stopPropagation();
    navigate(`/sprint-board/${projectId}`);
  };

  const handleDeleteProject = (projectId, projectName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      // Add delete API call here
      console.log('Delete project:', projectId);
    }
  };

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

  const handlePageChange = (page) => {
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



  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': '#10b981',
      'Completed': '#3b82f6',
      'Pending': '#f59e0b',
      'On Hold': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-wrapper">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              {user.role === "HR" ? "Manage and track all your projects" : "Your assigned projects"}
            </p>
          </div>
          <button className="create-btn" onClick={handleCreateProject}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{summaryStats.total}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{summaryStats.ongoing}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{summaryStats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{summaryStats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="controls-section">
        <div className="search-wrapper">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="search-btn">Search</button>
          </form>
        </div>

        <div className="filter-tabs">
          {['', 'Ongoing', 'Completed', 'Pending'].map(status => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => handleStatusFilter(status)}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="content-section">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>No projects found</h3>
            <p>Get started by creating your first project</p>
            <button className="empty-action-btn" onClick={handleCreateProject}>
              Create Project
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-table">
              <div className="table-wrapper">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Manager</th>
                      <th>Timeline</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => (
                      <tr key={project.id} onClick={() => handleProjectClick(project.id)}>
                        <td>
                          <div className="project-cell">
                            
                            <div className="project-info">
                              <div className="project-name">{project.name}</div>
                            
                            </div>
                          </div>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <div className="manager-cell">
                            
                            <span className="manager-name">{project.manager?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="timeline-cell">
                            <div className="timeline-start">{formatDate(project.start_date)}</div>
                            <div className="timeline-separator">→</div>
                            <div className="timeline-end">{formatDate(project.end_date)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="progress-cell">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="progress-text">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="actions-col">
                          <button 
                            className="action-btn view"
                            title="View Project"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project.id);
                            }}
                          >
                            👁
                          </button>
                          <button 
                            className="action-btn edit"
                            title="Edit Project"
                            onClick={(e) => handleEditProject(project.id, e)}
                          >
                            ✏️
                          </button>
                          {/* <button 
                            className="action-btn delete"
                            title="Delete Project"
                            onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                          >
                            🗑️
                          </button> */}

                          <button 
                            className="action-btn delete"
                            title="Go to Sprint"
                            onClick={(e) => handleSprint(project.id, e)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards">
              {projects.map(project => (
                <div key={project.id} className="project-card" onClick={() => handleProjectClick(project.id)}>
                  <div className="card-header">
                    
                    <div className="card-title-section">
                      <h4 className="card-title">{project.name}</h4>
                      <p className="card-subtitle">{project.description}</p>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="card-content">
                    <div className="card-field">
                      <span className="field-label">Manager:</span>
                      <span className="field-value">{project.manager?.name || 'Unassigned'}</span>
                    </div>
                    <div className="card-field">
                      <span className="field-label">Timeline:</span>
                      <span className="field-value">{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
                    </div>
                    <div className="card-field">
                      <span className="field-label">Progress:</span>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="progress-text">{project.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="card-action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}
                    >
                      View
                    </button>
                    <button 
                      className="card-action-btn edit"
                      onClick={(e) => handleEditProject(project.id, e)}
                    >
                      Edit
                    </button>
                    <button 
                      className="card-action-btn delete"
                      onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                  {pagination.totalCount} projects
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || paginationLoading}
                  >
                    Previous
                  </button>
                  <div className="pagination-numbers">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-number ${pageNum === pagination.currentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={paginationLoading}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || paginationLoading}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ProjectList;
