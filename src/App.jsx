import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/HR/HrDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/HR/Register';
import Layout from './components/layouts/Layout';
import "./App.css";
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './pages/Manager/AddProject';
import UserDetails from './pages/HR/UserDetails';
import ProjectDetails from './pages/Manager/ProjectDetails';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ProjectList from './pages/Manager/ProjectList';
import EmployeeList from './pages/Common/EmployeeList';
import SprintBoard from './pages/Sprint/SprintBoard';
import IssueDetailsPage from './pages/Sprint/IssueDetailsPage';
import EditProject from './pages/Manager/EditProject';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/hr-dashboard" element={<Dashboard />} />
                    <Route path="/add-user" element={<Register />} />
                    <Route path="/add-project" element={<AddProject />} />
                    <Route path="/edit-project/:id" element={<EditProject />} />
                    <Route path="/employee/details/:id" element={<UserDetails />} />
                    <Route path="/project-details/:id" element={<ProjectDetails />} />
                    <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                    <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                    <Route path="/project-list" element={<ProjectList />} />
                    <Route path="/employee-list" element={<EmployeeList />} />
                    <Route path="/sprint-board/:projectId" element={<SprintBoard />} />
                    <Route path="/issue/:id" element={<IssueDetailsPage />} />
                    <Route path="/" element={<Dashboard />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
