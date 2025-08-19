import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { AuthContext } from "../../context/auth-context";
import UploadAttachments from "../../components/uploads/UploadAttachments";

const EditProject = () => {
  const { id } = useParams(); // project id from route
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState(""); // UI only, not persisted to backend
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [attachments, setAttachments] = useState([]); // files to add on save

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true);

        const [mgrRes, compRes, projRes] = await Promise.all([
          axiosInstance.post("/hr-management/manager/list/", { role: "MANAGER" }),
          axiosInstance.post("/company/list/"),
          axiosInstance.get(`/projects/details/${id}/`),
        ]);

        if (mgrRes.data?.status) setManagers(mgrRes.data.records);
        if (compRes.data?.status) setCompanies(compRes.data.records);

        if (projRes.data?.status && projRes.data?.records) {
          const p = projRes.data.records;
          setName(p.name || "");
          setDescription(p.description || "");
          // If backend exposes manager id in details in the future, prefill it:
          // setManager(p.manager?.id || "");
        }
      } catch {
        setError("Failed to load project.");
      } finally {
        setIsLoading(false);
        setLoadingProject(false);
      }
    };

    bootstrap();
  }, [id]);

  const uploadAttachmentsForProject = async (projectId, files) => {
    if (!files || files.length === 0) return true;
    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      files.forEach((f) => formData.append("files", f));

      const res = await axiosInstance.post("/projects/upload-files/", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return !!res?.data?.status;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    try {
      // Update project metadata
      const updateRes = await axiosInstance.put(
        "/projects/update/",
        {
          id,
          name,
          description,
          // Provide both keys to maximize serializer compatibility without removing existing backend code
          manager: manager || undefined,
          manager_id: manager || undefined,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!updateRes.data?.status) {
        setError(updateRes.data?.message || "Could not update project.");
        setIsLoading(false);
        return;
      }

      // Upload new attachments (if any)
      const uploaded = await uploadAttachmentsForProject(id, attachments);
      if (!uploaded) {
        setSuccess("Project updated. Files failed to upload.");
      } else {
        setSuccess("Project updated successfully!");
      }

      setAttachments([]);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      setError("Error updating project.");
    }
    setIsLoading(false);
  };

  if (loadingProject) {
    return <div style={{ padding: 24 }}>Loading project...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 720, margin: "24px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Edit project</h2>

      {error ? (
        <div style={{ marginBottom: 12, color: "#b42318" }}>{error}</div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: 12, color: "#05603a" }}>{success}</div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Project name</label>
          <input
            type="text"
            value={name}
            disabled={isLoading}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="form-control"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Description
          </label>
          <textarea
            value={description}
            disabled={isLoading}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="form-control"
            rows={4}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Company</label>
          <select
            value={company}
            disabled={isLoading}
            onChange={(e) => setCompany(e.target.value)}
            className="form-control"
          >
            <option value="">Select company</option>
            {companies?.map((c) => (
              <option key={c.id || c._id || c.value} value={c.id || c._id || c.value}>
                {c.name || c.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Note: Company is currently not saved on the backend Project model.
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Manager</label>
          <select
            value={manager}
            disabled={isLoading}
            onChange={(e) => setManager(e.target.value)}
            className="form-control"
          >
            <option value="">Select manager (optional)</option>
            {managers?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user?.name || m.name || m.email || m.username || "Manager"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <UploadAttachments
            label="Add files"
            multiple
            maxFiles={10}
            value={attachments}
            onChange={setAttachments}
            disabled={isLoading}
            helperText="Allowed: pdf, docx, xlsx, jpg, jpeg, png"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{ minWidth: 140 }}
        >
          {isLoading ? "Saving..." : "Update Project"}
        </button>
      </form>
    </div>
  );
};

export default EditProject;
