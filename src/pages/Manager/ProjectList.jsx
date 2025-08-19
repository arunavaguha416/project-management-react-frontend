import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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

  const apiEndpoint =
    user.role === "HR" ? "/projects/list/" : "/projects/manager/list/";

  const fetchProjects = useCallback(async (isPagination = false) => {
    try {
      if (isPagination) setPaginationLoading(true);
      else setIsLoading(true);

      const res = await axiosInstance.post(apiEndpoint, {
        page_size: pagination.pageSize,
        page: pagination.currentPage,
        search: searchQuery
      });

      if (res.data.status) {
        setProjects(res.data.records || []);
        setPagination((prev) => ({
          ...prev,
          totalCount: res.data.count || 0,
          totalPages: res.data.num_pages || 1,
          currentPage: res.data.current_page || 1
        }));
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      if (isPagination) setPaginationLoading(false);
      else setIsLoading(false);
    }
  }, [apiEndpoint, pagination.currentPage, pagination.pageSize, searchQuery]);

  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects]);

  const handlePageChange = (page) => {
    setPagination((p) => ({ ...p, currentPage: page }));
    setTimeout(() => fetchProjects(true), 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, currentPage: 1 }));
    fetchProjects(false);
  };

  const handleBack = () => navigate(-1);

  const handleViewSprintBoard = (projectId) => {
    navigate(`/sprint-board/${projectId}`);
  };

  const handleEditProject = (projectId) => {
    navigate(`/project/details/${projectId}`);
  };

  const PaginationComp = ({
    currentPage,
    totalPages,
    onPageChange,
    totalCount,
    pageSize,
    isLoading = false
  }) => {
    const getPages = () => {
      const pages = [];
      const max = 5;
      if (totalPages <= max) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
      return pages;
    };

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);

    if (totalCount === 0) return null;

    return (
      <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
        <div className="text-muted small">
          {isLoading ? "Loading..." : `Showing ${start} to ${end} of ${totalCount} projects`}
        </div>
        {totalPages > 1 && (
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>Previous</button>
            </li>
            {getPages().map((p, i) =>
              p === "..." ? (
                <li key={i} className="page-item disabled"><span className="page-link">…</span></li>
              ) : (
                <li key={i} className={`page-item ${p === currentPage ? "active" : ""}`}>
                  <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                </li>
              )
            )}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>Next</button>
            </li>
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="dashboard-title">Project Management</h1>
        <div className="d-flex gap-2">
          {user.role === "HR" && (
            <button className="btn btn-jira" onClick={() => navigate("/add-project")}>
              Create Project
            </button>
          )}
          <button className="btn btn-outline-secondary" onClick={handleBack}>
            <i className="fas fa-arrow-left me-2"></i>Back
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="dashboard-section mb-4">
        <div className="section-header"><h2>Search & Filter</h2></div>
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
              <button type="submit" className="btn btn-jira w-100">Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>All Projects</h2>
          <span className="badge bg-primary">{pagination.totalCount} Total</span>
        </div>
        <div className="table-container">
          {isLoading ? (
            <div className="p-4 text-center">Loading projects...</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody style={{ opacity: paginationLoading ? 0.6 : 1 }}>
                {projects.length > 0 ? projects.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>{p.description}</td>
                    <td>{p.manager?.name || <span className="text-muted">Unassigned</span>}</td>
                    <td><span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{new Date(p.updated_at).toLocaleDateString()}</td>
                    <td className="d-flex gap-2">
                      {/* View Sprint Board */}
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewSprintBoard(p.id)}
                      >
                        View Sprint Board
                      </button>

                      {/* Edit icon button */}
                      <button
                        className="btn btn-sm btn-outline-jira"
                        title="Edit Project"
                        onClick={() => handleEditProject(p.id)}
                      >
                         Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center">No projects found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <PaginationComp {...pagination} onPageChange={handlePageChange} isLoading={paginationLoading} />
      </div>
    </div>
  );
};

export default ProjectList;
