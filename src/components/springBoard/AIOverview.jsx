// src/components/springBoard/AIOverview.jsx
import React, { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../../services/axiosinstance';
import CardDetailsModal from './CardDetailsModal';

const AIOverview = ({ projectId, sprintId, onCardsCreated, reloadKey }) => {
  // State Management
  const [projectFiles, setProjectFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [priorityCard, setPriorityCard] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  
  // Modal states
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Load project files
  const loadProjectFiles = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const res = await axiosInstance.post('/projects/upload-files-list/', {
        project_id: projectId
      });
      
      if (res?.data?.status) {
        setProjectFiles(res.data.records || []);
      }
    } catch (err) {
      console.error('Failed to load project files:', err);
      setProjectFiles([]);
    }
  }, [projectId]);

  // Load files when component mounts or when reloadKey changes
  useEffect(() => {
    loadProjectFiles();
  }, [loadProjectFiles, reloadKey]);

  // Reset state when parent triggers reload
  useEffect(() => {
    if (reloadKey > 0) {
      // Clear AI generated data when external reload happens
      setGeneratedCards([]);
      setPriorityCard(null);
      setAnalysisResult(null);
      setSelectedCardIds([]);
      setSelectedFiles([]);
      setError('');
    }
  }, [reloadKey]);

  // Handle file selection
  const handleFileSelection = useCallback((fileId, checked) => {
    setSelectedFiles(prev => 
      checked ? [...prev, fileId] : prev.filter(id => id !== fileId)
    );
  }, []);

  // Check if generate button should be disabled
  const isGenerateDisabled = loading || (projectFiles.length > 0 && selectedFiles.length === 0);

  // Generate cards with AI
  const generateCards = useCallback(async () => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }

    // If there are project files, require at least one to be selected
    if (projectFiles.length > 0 && selectedFiles.length === 0) {
      setError('Please select at least one document to analyze');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await axiosInstance.post('/projects/sprints/ai-overview/analyze/', {
        project_id: projectId,
        file_ids: selectedFiles,
        sprint_id: sprintId || null
      });

      if (res?.data?.status) {
        const data = res.data.records;
        setGeneratedCards(data.suggested_cards || []);
        setPriorityCard(data.priority_suggestion || null);
        setAnalysisResult(data.analysis || null);
        setSelectedCardIds((data.suggested_cards || []).map(card => card.ai_id));
      } else {
        setError(res?.data?.message || 'Failed to generate sprint cards');
      }
    } catch (err) {
      setError('Analysis failed - using fallback processing');
      console.error('AI Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFiles, sprintId, projectFiles.length]);

  // Open card modal
  const openCardModal = useCallback((card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  }, []);

  // Close card modal
  const closeCardModal = useCallback(() => {
    setSelectedCard(null);
    setShowCardModal(false);
  }, []);

  // Move card to backlog
  const moveToBacklog = useCallback(async (card) => {
    setLoading(true);
    
    try {
      const res = await axiosInstance.post('/projects/sprints/ai-overview/create-tasks/', {
        project_id: projectId,
        sprint_id: null, // null = backlog
        cards: [card]
      });

      if (res?.data?.status) {
        alert('Card moved to Backlog successfully!');
        
        // Remove card from generated cards
        setGeneratedCards(prev => prev.filter(c => c.ai_id !== card.ai_id));
        setSelectedCardIds(prev => prev.filter(id => id !== card.ai_id));
        
        // Close modal
        closeCardModal();
        
        // Notify parent
        onCardsCreated?.();
      } else {
        setError(res?.data?.message || 'Failed to move card to backlog');
      }
    } catch (err) {
      setError('Failed to move card to backlog');
      console.error('Move to backlog error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, onCardsCreated, closeCardModal]);

  // Move card to current sprint
  const moveToSprint = useCallback(async (card) => {
    if (!sprintId) {
      setError('No active sprint available');
      return;
    }

    setLoading(true);
    
    try {
      const res = await axiosInstance.post('/projects/sprints/ai-overview/create-tasks/', {
        project_id: projectId,
        sprint_id: sprintId,
        cards: [card]
      });

      if (res?.data?.status) {
        alert('Card moved to Sprint successfully!');
        
        // Remove card from generated cards
        setGeneratedCards(prev => prev.filter(c => c.ai_id !== card.ai_id));
        setSelectedCardIds(prev => prev.filter(id => id !== card.ai_id));
        
        // Close modal
        closeCardModal();
        
        // Notify parent
        onCardsCreated?.();
      } else {
        setError(res?.data?.message || 'Failed to move card to sprint');
      }
    } catch (err) {
      setError('Failed to move card to sprint');
      console.error('Move to sprint error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId, onCardsCreated, closeCardModal]);

  // Create selected cards in bulk
  const createSelectedCards = useCallback(async () => {
    if (selectedCardIds.length === 0) {
      setError('Please select cards to create');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const cardsToCreate = generatedCards.filter(card => 
        selectedCardIds.includes(card.ai_id)
      );

      const res = await axiosInstance.post('/projects/sprints/ai-overview/create-tasks/', {
        project_id: projectId,
        sprint_id: sprintId || null,
        cards: cardsToCreate
      });

      if (res?.data?.status) {
        alert(`${cardsToCreate.length} tasks created successfully!`);
        
        // Reset state
        setGeneratedCards([]);
        setPriorityCard(null);
        setAnalysisResult(null);
        setSelectedCardIds([]);
        setSelectedFiles([]);
        
        // Notify parent
        onCardsCreated?.();
      } else {
        setError(res?.data?.message || 'Failed to create sprint cards');
      }
    } catch (err) {
      setError('Failed to create cards');
      console.error('Create cards error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId, generatedCards, selectedCardIds, onCardsCreated]);

  // Toggle individual card selection
  const toggleCardSelection = useCallback((cardId) => {
    setSelectedCardIds(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  }, []);

  // Select all cards
  const selectAllCards = useCallback(() => {
    setSelectedCardIds(generatedCards.map(card => card.ai_id));
  }, [generatedCards]);

  // Clear all selections
  const clearAllCards = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

  return (
    <div className="ai-overview">
      {/* Header */}
      <div className="ai-header">
        <h3>🤖 AI Sprint Overview</h3>
        <p>Generate sprint cards using Google Gemini AI and move them to backlog or sprint</p>
      </div>

      {/* Document Selection */}
      <div className="ai-section">
        <h4>📁 Select Project Documents (Optional)</h4>
        {projectFiles.length === 0 ? (
          <div className="no-files-message">
            <p>No project files found. The AI will generate basic development cards.</p>
            <small>Tip: Upload project documents to get more specific task suggestions</small>
          </div>
        ) : (
          <div className="file-grid">
            {projectFiles.map(file => (
              <label key={file.id} className="file-card">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={(e) => handleFileSelection(file.id, e.target.checked)}
                />
                <div className="file-info">
                  <strong>{file.filename}</strong>
                  <div className="file-meta">
                    <span className="file-type">{file.extension?.toUpperCase()}</span>
                    <span className="file-size">{Math.round(file.size / 1024)}KB</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="ai-actions">
        <button 
          className="btn-generate-ai" 
          onClick={generateCards}
          disabled={isGenerateDisabled}
          title={
            projectFiles.length === 0 
              ? 'No project files available - will generate basic cards' 
              : selectedFiles.length === 0 
                ? 'Please select at least one document to analyze'
                : 'Generate AI-powered sprint cards'
          }
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing with AI...
            </>
          ) : (
            <>
              ✨ Generate Sprint Cards with AI
              {selectedFiles.length > 0 && ` (${selectedFiles.length} files selected)`}
            </>
          )}
        </button>
        
        {/* Helper text for disabled state */}
        {isGenerateDisabled && !loading && projectFiles.length > 0 && (
          <div className="generate-hint">
            Select at least one document to analyze with AI
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-section">
          <h4>📊 AI Analysis Results</h4>
          <div className="analysis-grid">
            <div className="analysis-card">
              <span className="metric-value">{analysisResult.features_count}</span>
              <span className="metric-label">Features Identified</span>
            </div>
            <div className="analysis-card">
              <span className="metric-value">{analysisResult.complexity_score}/10</span>
              <span className="metric-label">Complexity Score</span>
            </div>
            <div className="analysis-card">
              <span className="metric-value">{analysisResult.estimated_days}</span>
              <span className="metric-label">Estimated Days</span>
            </div>
            <div className="analysis-card">
              <span className="metric-value">{analysisResult.ai_confidence}%</span>
              <span className="metric-label">AI Confidence</span>
            </div>
          </div>
        </div>
      )}

      {/* Priority Suggestion */}
      {priorityCard && (
        <div className="priority-section">
          <h4>🎯 AI Recommendation: Start Here First</h4>
          <div className="priority-card-display">
            <div className="priority-header">
              <span className="priority-badge">RECOMMENDED FIRST</span>
              <span className="confidence-score">Confidence: {priorityCard.confidence}%</span>
            </div>
            <h5>{priorityCard.title}</h5>
            <p>{priorityCard.description}</p>
            <div className="priority-reasoning">
              <strong>Why start here:</strong>
              <ul>
                {priorityCard.reasoning?.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
            <div className="priority-actions">
              <button 
                className="btn-priority-action"
                onClick={() => openCardModal(priorityCard)}
              >
                View Details & Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Cards */}
      {generatedCards.length > 0 && (
        <div className="cards-section">
          <div className="cards-header">
            <h4>🎴 AI Generated Sprint Cards ({generatedCards.length})</h4>
            <div className="cards-controls">
              <button onClick={selectAllCards} className="btn-select-all">
                Select All
              </button>
              <button onClick={clearAllCards} className="btn-clear-all">
                Clear All
              </button>
              <button 
                onClick={createSelectedCards}
                disabled={selectedCardIds.length === 0 || loading}
                className="btn-create-cards"
              >
                Create {selectedCardIds.length} Selected Cards
              </button>
            </div>
          </div>

          <div className="cards-grid">
            {generatedCards.map(card => (
              <div 
                key={card.ai_id}
                className={`task-card ${selectedCardIds.includes(card.ai_id) ? 'selected' : ''} ${card.ai_id === priorityCard?.ai_id ? 'priority' : ''}`}
                onClick={() => openCardModal(card)}
              >
                <div className="card-header">
                  <input
                    type="checkbox"
                    checked={selectedCardIds.includes(card.ai_id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleCardSelection(card.ai_id);
                    }}
                  />
                  {card.ai_id === priorityCard?.ai_id && (
                    <span className="priority-star">⭐</span>
                  )}
                  <span className={`task-type-badge ${card.task_type.toLowerCase()}`}>
                    {card.task_type}
                  </span>
                </div>
                
                <h5 className="card-title">{card.title}</h5>
                <p className="card-description">{card.description}</p>
                
                <div className="card-meta">
                  <span className={`priority-level ${card.priority.toLowerCase()}`}>
                    {card.priority} Priority
                  </span>
                  <span className="story-points">
                    {card.story_points} SP
                  </span>
                </div>

                {card.acceptance_criteria && card.acceptance_criteria.length > 0 && (
                  <div className="acceptance-criteria">
                    <strong>Acceptance Criteria:</strong>
                    <ul>
                      {card.acceptance_criteria.slice(0, 3).map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                      {card.acceptance_criteria.length > 3 && (
                        <li className="more-criteria">
                          + {card.acceptance_criteria.length - 3} more criteria...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="card-click-hint">
                  <small>👆 Click to view details and move to backlog/sprint</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      {showCardModal && selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          onClose={closeCardModal}
          onMoveToBacklog={() => moveToBacklog(selectedCard)}
          onMoveToSprint={() => moveToSprint(selectedCard)}
          sprintId={sprintId}
          loading={loading}
        />
      )}
    </div>
  );
};

export default AIOverview;
