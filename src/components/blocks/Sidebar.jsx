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
  const [expandedItems, setExpandedItems] = useState(new Set(['Projects'])); // Projects expanded by default
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCollapse = useCallback((e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setIsCollapsed(prev => !prev);
  }, []);

  const handleSidebarClick = useCallback((e) => {
    if (window.innerWidth >= 1024) {
      const target = e.target;
      const isInteractive = target.closest('.nav-link') || 
                          target.closest('.logout-btn') || 
                          target.closest('.collapse-btn') || 
                          target.closest('.sub-nav') ||
                          target.closest('button') || 
                          target.closest('a');
      if (!isInteractive) {
        toggleCollapse(e);
      }
    }
  }, [toggleCollapse]);

  const handleNavigation = useCallback((path, label, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setActiveItem(label);
    setIsOpen(false);
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate]);

  const toggleSubmenu = useCallback((label, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  // ✅ FIXED: Moved getNavigationItems inside useCallback to make it stable
  const getNavigationItems = useCallback(() => {
    const roleSpecificItems = {
      HR: [
        { 
          path: '/hr-dashboard', 
          icon: '🏠', 
          label: 'Dashboard',
          gradient: 'from-blue-500 to-blue-600' 
        },
        { 
          path: '/employee-list', 
          icon: '👥', 
          label: 'Employees',
          gradient: 'from-green-500 to-emerald-600' 
        },
        { 
          path: '/project-list', 
          icon: '📊', 
          label: 'Projects',
          gradient: 'from-purple-500 to-purple-600',
          hasSubmenu: true,
          subItems: [
            { path: '/project-list', icon: '📋', label: 'View Projects' },
            { path: '/add-project', icon: '➕', label: 'Add Project' },
          ]
        },
        { 
          path: '/add-user', 
          icon: '👤', 
          label: 'Add Employee',
          gradient: 'from-indigo-500 to-indigo-600' 
        },
        { 
          path: '/ai-dashboard', 
          icon: '🤖', 
          label: 'AI Intelligence',
          gradient: 'from-cyan-500 to-cyan-600' 
        },
        { 
          path: '/leave-management', 
          icon: '📝', 
          label: 'Leave Management',
          gradient: 'from-orange-500 to-amber-600' 
        },
        { 
          path: '/time-tracking', 
          icon: '⏰', 
          label: 'Time Tracking',
          gradient: 'from-pink-500 to-rose-600' 
        },
      ],
      MANAGER: [
        { 
          path: '/manager-dashboard', 
          icon: '🏠', 
          label: 'Dashboard',
          gradient: 'from-blue-500 to-blue-600' 
        },
        { 
          path: '/project-list', 
          icon: '📊', 
          label: 'My Projects',
          gradient: 'from-purple-500 to-purple-600',
          hasSubmenu: true,
          subItems: [
            { path: '/project-list', icon: '📋', label: 'View Projects' },
            { path: '/add-project', icon: '➕', label: 'Add Project' },
          ]
        },
        { 
          path: '/employee-list', 
          icon: '👥', 
          label: 'Team Members',
          gradient: 'from-green-500 to-emerald-600' 
        },
        { 
          path: '/ai-dashboard', 
          icon: '🤖', 
          label: 'AI Intelligence',
          gradient: 'from-cyan-500 to-cyan-600' 
        },
        { 
          path: '/leave-management', 
          icon: '📝', 
          label: 'Leave Management',
          gradient: 'from-orange-500 to-amber-600' 
        },
        { 
          path: '/time-tracking', 
          icon: '⏰', 
          label: 'Time Tracking',
          gradient: 'from-pink-500 to-rose-600' 
        },
      ],
      USER: [
        { 
          path: '/employee-dashboard', 
          icon: '🏠', 
          label: 'Dashboard',
          gradient: 'from-blue-500 to-blue-600' 
        },
        { 
          path: '/projects', 
          icon: '📊', 
          label: 'My Projects',
          gradient: 'from-purple-500 to-purple-600' 
        },
        { 
          path: '/ai-assistant', 
          icon: '🤖', 
          label: 'AI Assistant',
          gradient: 'from-cyan-500 to-cyan-600' 
        },
        { 
          path: '/leave-management', 
          icon: '📝', 
          label: 'Leave Management',
          gradient: 'from-orange-500 to-amber-600' 
        },
        { 
          path: '/time-tracking', 
          icon: '⏰', 
          label: 'Time Tracking',
          gradient: 'from-pink-500 to-rose-600' 
        },
      ]
    };
    return roleSpecificItems[user?.role] || [];
  }, [user?.role]); // ✅ Only depends on user.role which is stable

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

  // ✅ FIXED: Now getNavigationItems is properly included in dependencies
  useEffect(() => {
    setIsOpen(false);
    const currentPath = location.pathname;
    const navItems = getNavigationItems();
    
    // Find active item including sub-items
    let currentItem = null;
    navItems.forEach(item => {
      if (currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))) {
        currentItem = item;
      }
      if (item.subItems) {
        item.subItems.forEach(subItem => {
          if (currentPath === subItem.path || (subItem.path !== '/' && currentPath.startsWith(subItem.path))) {
            currentItem = subItem;
            setExpandedItems(prev => new Set([...prev, item.label])); // Expand parent
          }
        });
      }
    });
    
    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname, getNavigationItems]); // ✅ Now includes getNavigationItems

  const getUserInitials = useCallback((user) => {
    if (!user?.name) return user?.email?.charAt(0)?.toUpperCase() || 'U';
    return user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }, []);

  const getRoleBadgeColor = useCallback((role) => {
    const colors = {
      HR: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      MANAGER: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      USER: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
    return colors[role] || colors.USER;
  }, []);

  if (!user) return null;

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="sidebar-toggle lg:hidden" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`hamburger ${isOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay lg:hidden" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        onClick={handleSidebarClick}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <span>✨</span>
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

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <span>{getUserInitials(user)}</span>
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || user?.email}</div>
            <div className="user-role">
              <span 
                className="role-badge" 
                style={{ background: getRoleBadgeColor(user?.role) }}
              >
                {user?.role || 'USER'}
              </span>
            </div>
            <div className="user-status">
              <span className="status-dot"></span>
              <span className="status-text">Online</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list main-nav">
            {navigationItems.map((item, index) => (
              <li key={index} className="nav-item">
                {item.hasSubmenu ? (
                  <>
                    <button
                      className={`nav-link ${expandedItems.has(item.label) ? 'expanded' : ''}`}
                      onClick={(e) => toggleSubmenu(item.label, e)}
                      title={item.label}
                    >
                      <span className="nav-icon-wrapper">
                        <span className="nav-icon">{item.icon}</span>
                      </span>
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-arrow">
                        <svg 
                          className={`arrow-icon ${expandedItems.has(item.label) ? 'rotated' : ''}`}
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor"
                        >
                          <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                      </span>
                    </button>
                    
                    {/* Submenu */}
                    <div className={`sub-nav ${expandedItems.has(item.label) ? 'expanded' : 'collapsed'}`}>
                      <ul className="sub-nav-list">
                        {item.subItems?.map((subItem, subIndex) => (
                          <li key={subIndex} className="sub-nav-item">
                            <button
                              className={`sub-nav-link ${activeItem === subItem.label ? 'active' : ''}`}
                              onClick={(e) => handleNavigation(subItem.path, subItem.label, e)}
                              title={subItem.label}
                            >
                              <span className="sub-nav-icon">{subItem.icon}</span>
                              <span className="sub-nav-label">{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <button
                    className={`nav-link ${activeItem === item.label ? 'active' : ''}`}
                    onClick={(e) => handleNavigation(item.path, item.label, e)}
                    title={item.label}
                  >
                    <span className="nav-icon-wrapper">
                      <span className="nav-icon">{item.icon}</span>
                    </span>
                    <span className="nav-label">{item.label}</span>
                    {item.label === 'Leave Management' && (
                      <span className="nav-badge">3</span>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="nav-divider"></div>
            <ul className="nav-list">
              <li className="nav-item">
                <button className="nav-link quick-action" title="Notifications">
                  <span className="nav-icon-wrapper">
                    <span className="nav-icon">🔔</span>
                  </span>
                  <span className="nav-label">Notifications</span>
                  <span className="notification-badge">5</span>
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link quick-action" title="Settings">
                  <span className="nav-icon-wrapper">
                    <span className="nav-icon">⚙️</span>
                  </span>
                  <span className="nav-label">Settings</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Sign out"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Sign Out</span>
          </button>
        </div>

        {/* Hints */}
        <div className="sidebar-hint desktop-only">Click anywhere to toggle</div>
        {isCollapsed && <div className="sidebar-hint-collapsed desktop-only">👆</div>}
      </aside>
    </>
  );
};

export default Sidebar;
