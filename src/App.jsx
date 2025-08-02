import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/login';
import Register from './pages/register';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import "./App.css";
import AddUser from './pages/AddUser';

const App = () => {
  return (
    <AuthProvider>
    
        <Router>
          <Header />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-user" element={<AddUser />} />
              <Route path="/" element={<Login />} />
            </Routes>
          </Router>
        <Footer />
    </AuthProvider>
  );
};

export default App;