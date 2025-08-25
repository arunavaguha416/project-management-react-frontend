// src/pages/Sprint/SprintBoard.jsx
import React, { useState, Suspense, useCallback, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../../assets/css/SprintBoard.css';
import axiosInstance from '../../services/axiosinstance';
import { AuthContext } from '../../context/auth-context';

// Lazy load components
const BacklogTab = React.lazy(() => import('../../components/springBoard/BacklogTab'));
const BoardTab = React.lazy(() => import('../../components/springBoard/BoardTab'));
const AllWorkTab = React.lazy(() => import('../../components/springBoard/AllWorkTab'));
const ReleasesTab = React.lazy(() => import('../../components/springBoard/ReleasesTab'));
const AIOverview = React.lazy(() => import('../../components/springBoard/AIOverview'));

// Import components
import CreateIssueQuickModal from '../../components/springBoard/CreateIssueQuickModal';
import SprintButton from '../../components/springBoard/SprintButton';

const SprintBoard = () => {
  // URL params
  const { projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || '';

  // Auth context
  const { user } = useContext(AuthContext);

  // Active tab state
  const [active, setActive] = useState('board');

  // Reload trigger for child components
  const [reloadKey, setReloadKey] = useState(0);
  
  // Sprint context state - Removed unused sprintName
  const [activeSprintId, setActiveSprintId] = useState('');
  const [isSprintActive, setIsSprintActive] = useState(false);

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Reload all child components
  const reloadAll = useCallback(() => {
    setReloadKey(prev => prev + 1);
  }, []);

  // Load current sprint on component mount
  const loadCurrentSprint = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const res = await axiosInstance.post(
        '/projects/sprints/current/',
        { project_id: projectId },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );

      if (res?.data?.status && res?.data?.records) {
        const sprint = res.data.records;
        setActiveSprintId(sprint.id || '');
        setIsSprintActive(sprint.status === 'ACTIVE');
        // Removed setSprintName since we're not using it
      } else {
        // No current sprint
        setActiveSprintId('');
        setIsSprintActive(false);
      }
    } catch (error) {
      console.error('Failed to load current sprint:', error);
      setActiveSprintId('');
      setIsSprintActive(false);
    }
  }, [projectId, user?.token]);

  // Load current sprint on mount and when project changes
  useEffect(() => {
    loadCurrentSprint();
  }, [loadCurrentSprint]);

  // Handle sprint context updates from child components or sprint button
  // Removed the name parameter since we're not using it
  const updateSprintContext = useCallback((sprintId, isActive) => {
    setActiveSprintId(sprintId);
    setIsSprintActive(isActive);
  }, []);

  // Keyboard navigation between tabs
  const onTabsKeyDown = useCallback((e) => {
    const order = ['ai', 'board', 'backlog', 'all', 'releases'];
    const idx = order.indexOf(active);
    
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive(order[(idx + 1) % order.length]);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive(order[(idx - 1 + order.length) % order.length]);
    }
  }, [active]);

  // Handle task creation success
  const handleTaskCreated = useCallback((taskData) => {
    console.log('Task created:', taskData);
    reloadAll();
    setShowCreate(false);
    setStatusMsg('Task created successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  }, [reloadAll]);

  // Clear status message
  const clearStatusMsg = useCallback(() => {
    setStatusMsg('');
  }, []);

  // Handle cards created from AI Overview
  const handleCardsCreated = useCallback(() => {
    reloadAll();
  }, [reloadAll]);

  // Tab configuration
  const tabs = [
    { key: 'ai', label: 'AI Overview', icon: '🤖' },
    { key: 'board', label: 'Board', icon: '📋' },
    { key: 'backlog', label: 'Backlog', icon: '📝' },
    { key: 'all', label: 'All Work', icon: '📊' },
    { key: 'releases', label: 'Releases', icon: '🚀' }
  ];

  return (
    <div className="sprint-board">
      {/* Single header row with tabs and action buttons */}
      <div className="sprint-board-header">
        <div className="header-content">
          {/* Left side - Navigation Tabs */}
          <div 
            className="tabs-nav"
            role="tablist"
            onKeyDown={onTabsKeyDown}
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`tab-button ${active === tab.key ? 'active' : ''}`}
                onClick={() => setActive(tab.key)}
                role="tab"
                aria-selected={active === tab.key}
                tabIndex={active === tab.key ? 0 : -1}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right side - Action Buttons */}
          <div className="header-actions">
            {/* Create Task Button - Same style as Sprint Button */}
            <button
              className="primary-action-button create-task-button"
              onClick={() => setShowCreate(true)}
              title="Create new task"
            >
              Create Task
            </button>

            {/* Sprint Button - Removed sprintName prop */}
            <SprintButton
              projectId={projectId}
              activeSprintId={activeSprintId}
              isSprintActive={isSprintActive}
              onSprintChange={updateSprintContext}
              reloadAll={reloadAll}
            />

            {/* Reload Button - Icon only, rightmost */}
            <button
              className="icon-action-button reload-button"
              onClick={reloadAll}
              title="Reload all data"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="status-message">
          <div className="status-content">
            {statusMsg}
            <button 
              className="status-close" 
              onClick={clearStatusMsg}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="tab-content">
        <Suspense fallback={
          <div className="loading-fallback">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        }>
          {active === 'ai' && (
            <AIOverview
              projectId={projectId}
              sprintId={activeSprintId}
              onCardsCreated={handleCardsCreated}
              reloadKey={reloadKey}
            />
          )}
          
          {active === 'board' && (
            <BoardTab
              projectId={projectId}
              sprintId={activeSprintId}
              onTaskUpdated={reloadAll}
              reloadKey={reloadKey}
            />
          )}
          
          {active === 'backlog' && (
            <BacklogTab
              projectId={projectId}
              sprintId={activeSprintId}
              onMoved={reloadAll}
              reloadKey={reloadKey}
            />
          )}
          
          {active === 'all' && (
            <AllWorkTab
              projectId={projectId}
              reloadKey={reloadKey}
            />
          )}
          
          {active === 'releases' && (
            <ReleasesTab
              projectId={projectId}
              reloadKey={reloadKey}
            />
          )}
        </Suspense>
      </div>

      {/* Create task modal */}
      {showCreate && (
        <CreateIssueQuickModal
          projectId={projectId}
          sprintId={isSprintActive ? activeSprintId : null}
          onClose={() => setShowCreate(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default SprintBoard;
