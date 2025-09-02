import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider} from './context/AuthContext'
import { AuthContext } from './context/auth-context';
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
import AIDashboard from './pages/ai/AIDashboard';
import AIAssistantPage from './pages/AI/AIAssistantPage';
import Unauthorized from './pages/Unauthorized';
import LeaveManagement from './components/LeaveManagement/LeaveManagement';
import LeaveRequestPage from './components/LeaveManagement/LeaveRequestPage';
import LeaveDetailsPage from './components/LeaveManagement/LeaveDetailsPage';

// Dashboard Redirect Component - Must be defined before the main App component
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'HR':
    case 'ADMIN':
      return <Navigate to="/hr-dashboard" replace />;
    case 'MANAGER':
      return <Navigate to="/manager-dashboard" replace />;
    case 'EMPLOYEE':
      return <Navigate to="/employee-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* HR/Admin Dashboard - Default Route */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* HR/Admin Only Routes */}
            <Route 
              path="/hr-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/add-user" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <Layout>
                    <Register />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/employee/details/:id" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER']}>
                  <Layout>
                    <UserDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Manager Dashboard */}
            <Route 
              path="/manager-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Employee Dashboard */}
            <Route 
              path="/employee-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                  <Layout>
                    <EmployeeDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Employee Leave Management */}
            <Route 
              path="/leave-management" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN','HR', 'MANAGER']}>
                  <Layout>
                    <LeaveManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-request" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN','HR', 'MANAGER']}>
                  <Layout>
                    <LeaveRequestPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/leave-request/:requestId" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN','HR', 'MANAGER']}>
                  <Layout>
                    <LeaveDetailsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Manager/Admin Project Management Routes */}
            <Route 
              path="/add-project" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <AddProject />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/edit-project/:id" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <EditProject />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Multi-Role Project Access */}
            <Route 
              path="/project-list" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'HR', 'EMPLOYEE']}>
                  <Layout>
                    <ProjectList />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/project-details/:id" 
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'EMPLOYEE', 'HR']}>
                  <Layout>
                    <ProjectDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Employee Management - HR/Manager Access */}
            <Route 
              path="/employee-list" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER']}>
                  <Layout>
                    <EmployeeList />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Sprint Management - Project Team Access */}
            <Route 
              path="/sprint-board/:projectId" 
              element={
                <ProtectedRoute allowedRoles={['HR','MANAGER', 'EMPLOYEE', 'ADMIN']}>
                  <Layout>
                    <SprintBoard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/projects/:projectId/tasks/:taskId" 
              element={
                <ProtectedRoute allowedRoles={['HR','MANAGER', 'EMPLOYEE', 'ADMIN']}>
                  <Layout>
                    <IssueDetailsPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* AI Features - All Authenticated Users */}
            <Route 
              path="/ai-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                  <Layout>
                    <AIDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                  <Layout>
                    <AIAssistantPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Role-Based Dashboard Redirects */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                  <DashboardRedirect />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route for 404 */}
            <Route 
              path="*" 
              element={
                <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <h1 className="display-1">404</h1>
                    <h2>Page Not Found</h2>
                    <p>The page you are looking for doesn't exist.</p>
                    <button 
                      onClick={() => window.location.href = '/login'} 
                      className="btn btn-primary"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
