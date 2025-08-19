import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Dashboard from './pages/HR/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/HR/Register';
import Layout from './components/layouts/Layout';
import "./App.css";
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './pages/Manager/AddProject';
import UserDetails from './pages/HR/UserDetails';
import ProjectDetails from './pages/Manager/ProjectDetails';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ProjectList from './pages/Manager/ProjectList';
import EmployeeList from './pages/Common/EmployeeList';
import SprintBoard from './pages/Sprint/SprintBoard';
import IssueDetailsPage from './pages/Sprint/IssueDetailsPage';
import EditProject from './pages/Manager/EditProject';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={<Login />} 
            />
            
            <Route 
              path="/" 
              element={<Login />} 
            />

            {/* Protected Routes with Layout */}
            <Route 
              path="/add-user" 
              element={
                <ProtectedRoute allowedRoles={["HR"]}>
                  <Layout>
                    <Register />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["HR"]}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/add-project" 
              element={
                <ProtectedRoute allowedRoles={["HR", "MANAGER"]}>
                  <Layout>
                    <AddProject />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/edit-project/:id" 
              element={
                <ProtectedRoute allowedRoles={["HR", "MANAGER"]}>
                  <Layout>
                    <EditProject />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/employee/details/:id" 
              element={
                <ProtectedRoute allowedRoles={["HR"]}>
                  <Layout>
                    <UserDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/project/details/:id" 
              element={
                <ProtectedRoute allowedRoles={["HR", "MANAGER"]}>
                  <Layout>
                    <ProjectDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/projects/list" 
              element={
                <ProtectedRoute allowedRoles={["HR", "MANAGER"]}>
                  <Layout>
                    <ProjectList />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/employee/list" 
              element={
                <ProtectedRoute allowedRoles={["HR", "MANAGER"]}>
                  <Layout>
                    <EmployeeList />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute allowedRoles={["USER"]}>
                  <Layout>
                    <EmployeeDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager-dashboard"
              element={
                <ProtectedRoute allowedRoles={["MANAGER"]}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

             <Route
              path="/sprint-board/:projectId"
              element={
                <ProtectedRoute allowedRoles={["MANAGER"]}>
                  <Layout>
                    <SprintBoard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/tasks/:taskId"
              element={
                <ProtectedRoute allowedRoles={["MANAGER"]}>
                  <Layout>
                    <IssueDetailsPage/>
                  </Layout>
                </ProtectedRoute>
              }
            />

          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
