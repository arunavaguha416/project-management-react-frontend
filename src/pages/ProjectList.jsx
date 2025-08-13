import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../services/axiosinstance";
import { AuthContext } from "../context/auth-context";
import { useNavigate } from "react-router-dom";

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0
  });

  const navigate = useNavigate();

  // Optimized fetch function with pagination loading state
  const fetchProjects = useCallback(async (isPagination = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setIsLoading(true);
      }
      
      const response = await axiosInstance.post("/projects/list/", {
        page_size: pagination.pageSize,
        page: pagination.currentPage,
        search: searchQuery
      });

      if (response.data.status) {
        setProjects(response.data.records || []);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.count || 0,
          totalPages: response.data.num_pages || 1,
          currentPage: response.data.current_page || 1
        }));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      if (isPagination) {
        setPaginationLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.pageSize, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects]);

  // Optimized page change handler
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    // Manually trigger fetch for pagination to avoid useEffect loop
    setTimeout(() => fetchProjects(true), 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProjects(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Optimized Pagination component with loading states
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
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
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
      <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
        <div className="text-muted small">
          {isLoading ? (
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Loading projects...
            </div>
          ) : (
            <>Showing {startItem} to {endItem} of {totalCount} projects</>
          )}
        </div>
        {totalPages > 1 ? (
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 || isLoading ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </button>
              </li>
              {getPageNumbers().map((page, index) => (
                <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}>
                  {page === '...' ? (
                    <span className="page-link">...</span>
                  ) : (
                    <button
                      className="page-link"
                      onClick={() => onPageChange(page)}
                      disabled={isLoading}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages || isLoading ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        ) : (
          <div className="text-muted small">
            Page 1 of 1
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Header with Back Button on Right */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-title">Project Management</h1>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-jira"
            onClick={() => navigate('/add-project')}
          >
            Create Project
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={handleBack}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="dashboard-section mb-4">
        <div className="section-header">
          <h2>Search & Filter</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSearch} className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-jira w-100">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Projects Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>All Projects</h2>
          <span className="badge bg-primary">{pagination.totalCount} Total</span>
        </div>
        <div className="table-container">
          {isLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Description</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Updated Date</th>
                    {user.role === 'HR' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody style={{ opacity: paginationLoading ? 0.6 : 1 }}>
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <tr key={project.id}>
                        <td className="fw-bold">{project.name}</td>
                        <td className="text-truncate" style={{maxWidth: '200px'}}>
                          {project.description}
                        </td>
                        <td>
                          {project.manager?.name || (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${project.status.toLowerCase()}`}>
                            {project.status}
                          </span>
                        </td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                        <td>{new Date(project.updated_at).toLocaleDateString()}</td>
                        {user.role === 'HR' && (
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-jira me-2"
                              onClick={() => navigate(`/projects/edit/${project.id}`)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-approve"
                              onClick={() => navigate(`/projects/manage/${project.id}`)}
                            >
                              Manage
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user.role === 'HR' ? 7 : 6} className="text-center text-muted py-4">
                        No projects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          isLoading={paginationLoading}
        />
      </div>
    </div>
  );
};

export default ProjectList;
