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



export default function App() {
  return (
    <AuthProvider>
    
        <Router>
          <Header />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/register"
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
                <ProtectedRoute allowedRoles={["HR"]}>
                     <AddProject />
                  </ProtectedRoute>
                } />
                <Route path="/user/details/:id" element={
                <ProtectedRoute allowedRoles={["HR"]}>
                     <UserDetails />
                  </ProtectedRoute>
                } />
                <Route path="/project/details/:id" element={
                <ProtectedRoute allowedRoles={["HR"]}>
                     <ProjectDetails />
                  </ProtectedRoute>
                } />

              
              <Route path="/" element={<Login />} />
            </Routes>
          <Footer />
        </Router>
        
    </AuthProvider>
  );
}
