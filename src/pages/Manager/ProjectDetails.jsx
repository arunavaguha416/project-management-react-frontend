// File: src/pages/projects/ProjectDetails.jsx

import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import axiosInstance from "../../services/axiosinstance";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [projectData, setProjectData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [files, setFiles] = useState([]); // NEW: files list

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamSize: 0,
  });

  const [errors, setErrors] = useState({
    projectDetails: null,
    teamMembers: null,
    tasks: null,
    milestones: null,
    files: null, // NEW
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    projectDetails: true,
    teamMembers: true,
    tasks: true,
    milestones: true,
    files: true, // NEW
  });

  // Loading aggregator
  const checkAllLoaded = useCallback(() => {
    setTimeout(() => {
      setLoadingStates((current) => {
        const allLoaded = !Object.values(current).some((loading) => loading);
        if (allLoaded) {
          setIsLoading(false);
        }
        return current;
      });
    }, 100);
  }, []);

  // Data fetchers
  const fetchProjectDetails = useCallback(async () => {
    try {
      const projectResp = await axiosInstance.get(`/projects/details/${id}/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProjectData(projectResp.data.records);
      setErrors((prev) => ({ ...prev, projectDetails: null }));
    } catch (error) {
      console.error("Error fetching project details:", error);
      setErrors((prev) => ({
        ...prev,
        projectDetails: "Failed to load project details",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, projectDetails: false }));
      checkAllLoaded();
    }
  }, [id, user.token, checkAllLoaded]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const teamResp = await axiosInstance.post(
        `/teams/team-members/`,
        { project_id: id, page_size: 20 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const members = teamResp.data.records || [];
      setTeamMembers(members);
      setStats((prev) => ({ ...prev, teamSize: members.length }));
      setErrors((prev) => ({ ...prev, teamMembers: null }));
    } catch (error) {
      console.error("Error fetching team members:", error);
      setErrors((prev) => ({
        ...prev,
        teamMembers: "Failed to load team members",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, teamMembers: false }));
      checkAllLoaded();
    }
  }, [id, user.token, checkAllLoaded]);

  const fetchTasks = useCallback(async () => {
    try {
      const tasksResp = await axiosInstance.post(
        `/projects/tasks/list/`,
        { project_id: id, page_size: 10 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const projectTasks = tasksResp.data.records || [];
      setTasks(projectTasks);
      setStats((prev) => ({
        ...prev,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === "COMPLETED").length,
        pendingTasks: projectTasks.filter((t) => t.status === "PENDING").length,
      }));
      setErrors((prev) => ({ ...prev, tasks: null }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setErrors((prev) => ({ ...prev, tasks: "Failed to load tasks" }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, tasks: false }));
      checkAllLoaded();
    }
  }, [id, user.token, checkAllLoaded]);

  const fetchMilestones = useCallback(async () => {
    try {
      const milestonesResp = await axiosInstance.post(
        `/projects/milestones/list/`,
        { project_id: id, page_size: 10 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMilestones(milestonesResp.data.records || []);
      setErrors((prev) => ({ ...prev, milestones: null }));
    } catch (error) {
      console.error("Error fetching milestones:", error);
      setErrors((prev) => ({
        ...prev,
        milestones: "Failed to load milestones",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, milestones: false }));
      checkAllLoaded();
    }
  }, [id, user.token, checkAllLoaded]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axiosInstance.post(
        `/projects/upload-files-list/`,
        { project_id: id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setFiles(res?.data?.records || []);
      setErrors((prev) => ({ ...prev, files: null }));
    } catch (error) {
      console.error("Error fetching files:", error);
      setErrors((prev) => ({ ...prev, files: "Failed to load files" }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, files: false }));
      checkAllLoaded();
    }
  }, [id, user.token, checkAllLoaded]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.allSettled([
      fetchProjectDetails(),
      fetchTeamMembers(),
      fetchTasks(),
      fetchMilestones(),
      fetchFiles(),
    ]);
  }, [fetchProjectDetails, fetchTeamMembers, fetchTasks, fetchMilestones, fetchFiles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAddTeamMember = () => navigate(`/project/${id}/add-member`);
  const handleEditProject = () => navigate(`/edit-project/${id}`);

  // UI helpers
  const ErrorMessage = ({ message, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <div className="ml-3">
            <button onClick={onRetry} className="text-sm text-red-600 hover:text-red-800 underline">
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

  // Initial loading state
  if (isLoading && loadingStates.projectDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading project details...</div>
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
                <h1 className="text-2xl font-bold text-gray-800">Project Details</h1>
                <p className="text-gray-600 mt-1">{projectData?.name || "Project"}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Back to Dashboard
                </button>
                {(user.role === "HR" || user.role === "ADMIN" || user.role === "MANAGER") && (
                  <>
                    <button
                      onClick={handleAddTeamMember}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add Team Member
                    </button>
                    <button
                      onClick={handleEditProject}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit Project
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Show general errors */}
            {errors.projectDetails && (
              <div className="mt-4">
                <ErrorMessage message={errors.projectDetails} onRetry={fetchProjectDetails} />
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2-2V7a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-2V9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  {loadingStates.tasks ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
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
                  <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                  {loadingStates.tasks ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  {loadingStates.tasks ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingTasks}</p>
                  )}
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
                  <p className="text-sm font-medium text-gray-600">Team Size</p>
                  {loadingStates.teamMembers ? (
                    <div className="text-2xl font-semibold text-gray-300">...</div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats.teamSize}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Information</h2>

            {errors.projectDetails ? (
              <ErrorMessage message={errors.projectDetails} onRetry={fetchProjectDetails} />
            ) : loadingStates.projectDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <LoadingSpinner />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{projectData?.name || "--"}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status</div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                          projectData?.status === "Ongoing"
                            ? "bg-green-100 text-green-800"
                            : projectData?.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {projectData?.status || "--"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Manager</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {projectData?.manager_name || "Unassigned"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Company</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {projectData?.company_name || "--"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Start Date</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {projectData?.start_date || "--"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">End Date</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{projectData?.end_date || "--"}</div>
                  </div>
                </div>

                {projectData?.description && (
                  <div className="mt-6">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Description
                    </div>
                    <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">{projectData.description}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Grid: Left = Files, Right = Recent Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Files Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Files</h2>
                <span className="text-sm text-gray-500">{files?.length || 0} files</span>
              </div>

              {errors.files ? (
                <ErrorMessage message={errors.files} onRetry={fetchFiles} />
              ) : loadingStates.files ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {files.length > 0 ? (
                    files.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center min-w-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-indigo-700">
                              {(f.extension || f.filename?.split(".").pop() || "?")
                                .toString()
                                .slice(0, 3)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {f.url ? (
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline"
                                  title={f.filename}
                                >
                                  {f.filename}
                                </a>
                              ) : (
                                <span title={f.filename}>{f.filename}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {(f.extension || "").toUpperCase()} •{" "}
                              {Math.round(((f.size || 0) / 1024) * 10) / 10}KB • {f.created_at || ""}
                            </div>
                          </div>
                        </div>
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap ml-3"
                          >
                            Download
                          </a>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">📁</div>
                      <div>No files uploaded</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Tasks Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Tasks</h2>
                <button
                  onClick={() => navigate(`/project/${id}/tasks`)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>

              {errors.tasks ? (
                <ErrorMessage message={errors.tasks} onRetry={fetchTasks} />
              ) : loadingStates.tasks ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.length > 0 ? (
                    tasks.map((task, index) => (
                      <div key={`${task.id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {task.title || task.name}
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Assigned to: {task.assignee_name || "Unassigned"}</span>
                              <span>Due: {task.due_date || "No due date"}</span>
                            </div>
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              task.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : task.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status || "PENDING"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">📋</div>
                      <div>No tasks created yet</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Milestones + Team Members split row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Members Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Team Members</h2>
                <span className="text-sm text-gray-500">{teamMembers.length} members</span>
              </div>

              {errors.teamMembers ? (
                <ErrorMessage message={errors.teamMembers} onRetry={fetchTeamMembers} />
              ) : loadingStates.teamMembers ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member, idx) => (
                      <div
                        key={member.employee_id || member.id || idx}
                        className="flex items-center p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-sm font-semibold">
                          {(member.employee_name || member.name || "?").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              {member.employee_name || member.name || "Member"}
                            </h4>
                            {member.designation ? (
                              <span className="text-xs text-gray-500">{member.designation}</span>
                            ) : null}
                          </div>
                          {(member.employee_email || member.email) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {member.employee_email || member.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">👥</div>
                      <div>No team members found</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project Milestones Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Project Milestones</h2>
                <span className="text-sm text-gray-500">{milestones.length} milestones</span>
              </div>

              {errors.milestones ? (
                <ErrorMessage message={errors.milestones} onRetry={fetchMilestones} />
              ) : loadingStates.milestones ? (
                <div className="space-y-2">
                  <LoadingSpinner />
                  <LoadingSpinner />
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.length > 0 ? (
                    milestones.map((milestone, index) => (
                      <div key={`${milestone.id}-${index}`} className="flex items-center p-4 border border-gray-200 rounded-lg">
                        <div
                          className={`w-4 h-4 rounded-full mr-4 ${
                            milestone.status === "COMPLETED"
                              ? "bg-green-500"
                              : milestone.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              {milestone.title || milestone.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {milestone.due_date || milestone.target_date}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">🎯</div>
                      <div>No milestones set</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* End split row */}

        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
