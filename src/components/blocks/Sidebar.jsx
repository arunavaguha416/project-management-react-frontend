import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import '../../assets/css/Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle collapse state - now callable from anywhere
  const toggleCollapse = useCallback((e) => {
    // Prevent event from bubbling if it's a specific element click
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setIsCollapsed(prev => !prev);
  }, []);

  // Handle sidebar area clicks for collapse/expand
  const handleSidebarClick = useCallback((e) => {
    // Only toggle if we're on desktop and not clicking on interactive elements
    if (window.innerWidth >= 1024) {
      const target = e.target;
      const isInteractive = target.closest('.nav-link') || 
                           target.closest('.logout-btn') || 
                           target.closest('.collapse-btn') ||
                           target.closest('button') ||
                           target.closest('a');
      
      // If not clicking on interactive elements, toggle collapse
      if (!isInteractive) {
        toggleCollapse(e);
      }
    }
  }, [toggleCollapse]);

  // Enhanced navigation handler with active state
  const handleNavigation = useCallback((path, label, e) => {
    // Stop propagation to prevent sidebar collapse
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    console.log('=== SIDEBAR NAVIGATION ===');
    console.log('Attempting to navigate to:', path);
    console.log('Current location:', location.pathname);
    console.log('User role:', user?.role);
    
    setActiveItem(label);
    setIsOpen(false);
    
    try {
      navigate(path);
      console.log('Navigate called successfully');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate, location.pathname, user?.role]);

  // Handle click outside (only for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const toggleButton = document.querySelector('.sidebar-toggle');
        if (!toggleButton || !toggleButton.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-close mobile overlay on route change and update active item
  useEffect(() => {
    setIsOpen(false);
    
    // Define navigation items inside useEffect to avoid dependency issues
    const getNavigationItems = () => {
      const roleSpecificItems = {
        HR: [
          { path: '/hr-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/employee-list', icon: '👥', label: 'Employees' },
          { path: '/project-list', icon: '📁', label: 'Projects' },
          { path: '/add-project', icon: '➕', label: 'Add Project' },
          { path: '/add-user', icon: '👤', label: 'Add Employee' }
        ],
        MANAGER: [
          { path: '/manager-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/project-list', icon: '📁', label: 'My Projects' },
          { path: '/add-project', icon: '➕', label: 'Add Project' },
          { path: '/employee-list', icon: '👥', label: 'Team Members' }
        ],
        USER: [
          { path: '/employee-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/projects', icon: '📁', label: 'My Projects' }
        ]
      };

      return roleSpecificItems[user?.role] || [];
    };
    
    // Set active item based on current path
    const currentPath = location.pathname;
    const navItems = getNavigationItems();
    const currentItem = navItems.find(item => 
      currentPath === item.path || 
      (item.path !== '/' && currentPath.startsWith(item.path))
    );
    
    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname, user?.role]);

  // Get navigation items for rendering
  const getNavigationItems = () => {
    const roleSpecificItems = {
      HR: [
        { path: '/hr-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/employee-list', icon: '👥', label: 'Employees' },
        { path: '/project-list', icon: '📁', label: 'Projects' },
        { path: '/add-project', icon: '➕', label: 'Add Project' },
        { path: '/add-user', icon: '👤', label: 'Add Employee' }
      ],
      MANAGER: [
        { path: '/manager-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/project-list', icon: '📁', label: 'My Projects' },
        { path: '/add-project', icon: '➕', label: 'Add Project' },
        { path: '/employee-list', icon: '👥', label: 'Team Members' }
      ],
      USER: [
        { path: '/employee-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/projects', icon: '📁', label: 'My Projects' }
      ]
    };

    return roleSpecificItems[user?.role] || [];
  };

  const getUserInitials = (user) => {
    if (!user?.name) return user?.email?.charAt(0)?.toUpperCase() || 'U';
    return user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      HR: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
      MANAGER: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      USER: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
    };
    return colors[role] || colors.USER;
  };

  if (!user) return null;

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <div className={`hamburger ${isOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Click anywhere to toggle collapse on desktop */}
      <aside 
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        onClick={handleSidebarClick}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <span>PM</span>
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <h3>ProjectFlow</h3>
                <span>Management Suite</span>
              </div>
            )}
          </div>
          
          {/* Desktop Collapse Button */}
          <button 
            className="collapse-btn desktop-only"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {getUserInitials(user)}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">{user?.name || user?.email}</div>
              <div className="user-role">
                <div 
                  className="role-badge"
                  style={{ background: getRoleBadgeColor(user?.role) }}
                >
                  {user?.role}
                </div>
              </div>
              <div className="user-status">
                <span className="status-dot"></span>
                <span className="status-text">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Main Navigation */}
          <ul className="nav-list main-nav">
            {navigationItems.map((item, index) => (
              <li key={index} className="nav-item">
                <button
                  className={`nav-link ${activeItem === item.label ? 'active' : ''}`}
                  onClick={(e) => handleNavigation(item.path, item.label, e)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="nav-divider"></div>

          {/* Quick Actions */}
          <ul className="nav-list quick-actions">
            <li className="nav-item">
              <button 
                className="nav-link quick-action"
                title={isCollapsed ? "Notifications" : ''}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="nav-icon">🔔</span>
                {!isCollapsed && <span className="nav-label">Notifications</span>}
                <span className="notification-badge">3</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className="nav-link quick-action"
                title={isCollapsed ? "Settings" : ''}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="nav-icon">⚙️</span>
                {!isCollapsed && <span className="nav-label">Settings</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            title={isCollapsed ? "Sign Out" : ''}
          >
            <span className="logout-icon">🚪</span>
            {!isCollapsed && <span className="logout-text">Sign Out</span>}
          </button>
        </div>

        {/* Click-to-toggle hint for desktop users */}
        {!isCollapsed && (
          <div className="sidebar-hint desktop-only">
            <span className="hint-text">Click anywhere to collapse</span>
          </div>
        )}
        {isCollapsed && (
          <div className="sidebar-hint-collapsed desktop-only">
            <span className="hint-icon">👆</span>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
