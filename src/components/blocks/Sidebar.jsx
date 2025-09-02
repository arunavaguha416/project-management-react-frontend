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

  // Toggle collapse state
  const toggleCollapse = useCallback((e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setIsCollapsed(prev => !prev);
  }, []);

  // Handle sidebar area clicks for collapse/expand
  const handleSidebarClick = useCallback((e) => {
    if (window.innerWidth >= 1024) {
      const target = e.target;
      const isInteractive = target.closest('.nav-link') || 
                           target.closest('.logout-btn') || 
                           target.closest('.collapse-btn') || 
                           target.closest('button') || 
                           target.closest('a');

      if (!isInteractive) {
        toggleCollapse(e);
      }
    }
  }, [toggleCollapse]);

  // Enhanced navigation handler with active state
  const handleNavigation = useCallback((path, label, e) => {
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
    
    const getNavigationItems = () => {
      const roleSpecificItems = {
        HR: [
          { path: '/hr-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/employee-list', icon: '👥', label: 'Employees' },
          { path: '/project-list', icon: '📁', label: 'Projects' },
          { path: '/add-project', icon: '➕', label: 'Add Project' },
          { path: '/add-user', icon: '👤', label: 'Add Employee' },
          { path: '/ai-dashboard', icon: '🤖', label: 'AI Intelligence' },
          { path: '/leave-management', icon: '📊', label: 'Leave Management' },
        ],
        MANAGER: [
          { path: '/manager-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/project-list', icon: '📁', label: 'My Projects' },
          { path: '/add-project', icon: '➕', label: 'Add Project' },
          { path: '/employee-list', icon: '👥', label: 'Team Members' },
          { path: '/ai-dashboard', icon: '🤖', label: 'AI Intelligence' },
          { path: '/leave-management', icon: '📊', label: 'Leave Management' }
        ],
        USER: [
          { path: '/employee-dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/projects', icon: '📁', label: 'My Projects' },
          { path: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
          { path: '/leave-management', icon: '📊', label: 'Leave Management' }
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
        { path: '/add-user', icon: '👤', label: 'Add Employee' },
        { path: '/ai-dashboard', icon: '🤖', label: 'AI Intelligence' },
        { path: '/leave-management', icon: '📊', label: 'Leave Management' },
      ],
      MANAGER: [
        { path: '/manager-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/project-list', icon: '📁', label: 'My Projects' },
        { path: '/add-project', icon: '➕', label: 'Add Project' },
        { path: '/employee-list', icon: '👥', label: 'Team Members' },
        { path: '/ai-dashboard', icon: '🤖', label: 'AI Intelligence' },
        { path: '/leave-management', icon: '📊', label: 'Leave Management' },
      ],
      USER: [
        { path: '/employee-dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/projects', icon: '📁', label: 'My Projects' },
        { path: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
        { path: '/leave-management', icon: '📊', label: 'Leave Management' },
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
      {isOpen && <div className="sidebar-overlay"></div>}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        onClick={handleSidebarClick}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              PM
            </div>
            <div className="brand-text">
              <h3>Project Hub</h3>
              <span>Management Suite</span>
            </div>
          </div>
          <button 
            className="collapse-btn desktop-only"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="collapse-icon">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>

        {/* User Section */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {getUserInitials(user)}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name || user.email}</div>
            <div className="user-role">
              <div 
                className="role-badge"
                style={{ background: getRoleBadgeColor(user.role) }}
              >
                {user.role}
              </div>
            </div>
            <div className="user-status">
              <div className="status-dot"></div>
              <span className="status-text">Online</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list main-nav">
            {navigationItems.map((item, index) => (
              <li key={index} className="nav-item">
                <button
                  className={`nav-link ${activeItem === item.label ? 'active' : ''}`}
                  onClick={(e) => handleNavigation(item.path, item.label, e)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.label === 'AI Intelligence' && (
                    <span className="notification-badge">NEW</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="nav-divider"></div>

          {/* Quick Actions */}
          <ul className="nav-list quick-actions">
            <li className="nav-item">
              <button 
                className="nav-link quick-action"
                onClick={(e) => handleNavigation('/sprint-board', 'Sprint Board', e)}
                title={isCollapsed ? 'Sprint Board' : undefined}
              >
                <span className="nav-icon">📋</span>
                <span className="nav-label">Sprint Board</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>

        {/* Hints for collapse functionality */}
        {!isCollapsed && (
          <div className="sidebar-hint">
            Click anywhere to collapse
          </div>
        )}
        {isCollapsed && (
          <div className="sidebar-hint-collapsed">
            👆
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
