import React, { useState, useEffect, useContext, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";

const ProjectList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Data states
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0
  });

  // Assign modal
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    projectId: null,
    selectedEmployee: ""
  });

  const apiEndpoint =
    user.role === "HR" ? "/projects/list/" : "/projects/manager/list/";

  // Fetch projects
  const fetchProjects = useCallback(
    async (isPagination = false) => {
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
    },
    [apiEndpoint, pagination.currentPage, pagination.pageSize, searchQuery]
  );

  // Initial load
  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects]);

  // Pagination change
  const handlePageChange = (page) => {
    setPagination((p) => ({ ...p, currentPage: page }));
    setTimeout(() => fetchProjects(true), 0);
  };

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, currentPage: 1 }));
    fetchProjects(false);
  };

  // Back navigation
  const handleBack = () => navigate(-1);

  // Open Assign Modal (fetch managers)
  const openAssignModal = async (projectId) => {
    setAssignModal({ isOpen: true, projectId, selectedEmployee: "" });
    try {
      const res = await axiosInstance.post("/hr-management/employees/list/", {
        page_size: 50,
        role: "MANAGER"
      });
      if (res.data.status) setEmployees(res.data.records || []);
      else setEmployees([]);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, projectId: null, selectedEmployee: "" });
  };

  // Assign API call
  const handleAssignProject = async () => {
    if (!assignModal.selectedEmployee) {
      alert("Please select an employee");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await axiosInstance.put("/projects/assign-manager/", {
        id: assignModal.projectId,
        manager_id: assignModal.selectedEmployee
      });
      if (res.data.status) {
        alert("Project assigned successfully!");
        closeAssignModal();
        fetchProjects(false);
      } else {
        alert(res.data.message || "Failed to assign project");
      }
    } catch (err) {
      console.error("Error assigning project:", err);
      alert("Something went wrong");
    } finally {
      setIsAssigning(false);
    }
  };

  // Pagination component
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
                  {user.role === 'HR' && <th>Actions</th>}
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
                    {user.role === 'HR' && (
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openAssignModal(p.id)}>Assign</button>
                        <button className="btn btn-sm btn-outline-jira me-2"
                          onClick={() => navigate(`/projects/edit/${p.id}`)}>Edit</button>
                        <button className="btn btn-sm btn-approve"
                          onClick={() => navigate(`/projects/manage/${p.id}`)}>Manage</button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={user.role === 'HR' ? 7 : 6} className="text-center">No projects found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <PaginationComp {...pagination} onPageChange={handlePageChange} isLoading={paginationLoading} />
      </div>

      {/* Assign Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeAssignModal}></div>
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full z-50">
            <div className="flex justify-between items-center p-4 border-b">
              <h5 className="mb-0">Assign Project</h5>
              <button type="button" className="btn-close" onClick={closeAssignModal}></button>
            </div>
            <div className="p-4">
              <label className="form-label">Select Manager</label>
              <select className="form-select"
                value={assignModal.selectedEmployee}
                onChange={(e) => setAssignModal((prev) => ({ ...prev, selectedEmployee: e.target.value }))}
              >
                <option value="">-- Select --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.name} ({emp.user?.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button className="btn btn-secondary" onClick={closeAssignModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignProject} disabled={isAssigning}>
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectList;
