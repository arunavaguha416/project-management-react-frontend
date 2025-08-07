import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosinstance";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const projResp = await axiosInstance.get(`/project/details/${id}/`);
        setProject(projResp.data.records);
        const taskResp = await axiosInstance.get(`/project/${id}/tasks/`);
        setTasks(taskResp.data.records || []);
      } catch {
        setError("Could not fetch project details.");
      }
    }
    fetchData();
  }, [id]);

  if (error) return <div className="container py-4">{error}</div>;
  if (!project) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-5">
       
      <div className="card p-4">
        <div className="mb-2">
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              style={{marginBottom: ".5em", float: "left"}}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
        <h3>Project Details</h3>
        <table className="table">
          <tbody>
            <tr><th>Project Name</th><td>{project.name}</td></tr>
            <tr><th>Manager</th><td>{project.manager_name}</td></tr>
            <tr><th>Start Date</th><td>{project.start_date}</td></tr>
            <tr><th>End Date</th><td>{project.end_date}</td></tr>
            <tr><th>Status</th><td>{project.status}</td></tr>
            <tr><th>Client Name</th><td>{project.client_name}</td></tr>
            <tr><th>Current Sprint</th><td>{project.current_sprint}</td></tr>
          </tbody>
        </table>
        <h5 className="mt-4">Task List</h5>
        <table className="table table-sm">
          <thead><tr>
            <th>ID</th><th>Task</th><th>Assigned To</th><th>Status</th>
          </tr></thead>
          <tbody>
            {tasks.map(task =>
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.assigned_to_name}</td>
                <td>{task.status}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ProjectDetails;
