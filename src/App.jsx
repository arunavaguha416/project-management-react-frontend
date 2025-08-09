import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/register';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import "./App.css";
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './pages/AddProject';
import UserDetails from './pages/UserDetails';
import ProjectDetails from './pages/ProjectDetails';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ProjectList from './pages/ProjectList';
import EmployeeList from './pages/EmployeeList';



export default function App() {
  return (
    <AuthProvider>
    
        <Router>
           <div className="app-container">
              <Header />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/add-user" element={<Register />} />EmployeeDashboard
                  <Route
                    path="/add-user"
                    element={
                      <ProtectedRoute allowedRoles={["HR"]}>
                        <Register />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={["HR"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />

                    <Route path="/add-project" element={
                    <ProtectedRoute allowedRoles={["HR","MANAGER"]}>
                        <AddProject />
                      </ProtectedRoute>
                    } />
                    <Route path="/employee/details/:id" element={
                    <ProtectedRoute allowedRoles={["HR"]}>
                        <UserDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/project/details/:id" element={
                    <ProtectedRoute allowedRoles={["HR","MANAGER"]}>
                        <ProjectDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/projects/list" element={
                    <ProtectedRoute allowedRoles={["HR","MANAGER"]}>
                        <ProjectList />
                      </ProtectedRoute>
                    } />

                    <Route path="/employee/list" element={
                    <ProtectedRoute allowedRoles={["HR","MANAGER"]}>
                        <EmployeeList />
                      </ProtectedRoute>
                    } />

                    <Route
                    path="/employee-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["USER"]}>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["MANAGER"]}>
                        <ManagerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="/" element={<Login />} />
                </Routes>
              <Footer />
          </div>
        </Router>
        
    </AuthProvider>
  );
}
