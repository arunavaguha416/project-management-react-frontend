import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import '../../assets/css/Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const roleSpecificItems = {
      HR: [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/employee/list', icon: '👥', label: 'Employees' },
        { path: '/projects/list', icon: '📁', label: 'Projects' },
        { path: '/add-user', icon: '➕', label: 'Add Employee' }
      ],
      MANAGER: [
        { path: '/manager-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/projects/list', icon: '📁', label: 'My Projects' },
        { path: '/add-project', icon: '➕', label: 'Add Project' },
        { path: '/employee/list', icon: '👥', label: 'Team Members' }
      ],
      USER: [
        { path: '/employee-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/projects/list', icon: '📁', label: 'My Projects' }
      ]
    };

    return roleSpecificItems[user?.role] || [];
  };

  if (!user) return null;

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">EMS</div>
            <div className="brand-text">
              <h3>Employee Portal</h3>
              <span>Management System</span>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <div className="user-status">
            <span className="status-dot"></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            <ul className="nav-list">
              {getNavigationItems().map((item, index) => (
                <li key={index} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={closeSidebar}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-arrow">→</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <span className={`hamburger ${isOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </>
  );
};

export default Sidebar;
