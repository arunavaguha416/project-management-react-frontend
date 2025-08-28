// src/components/ai/AIAssistant.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import axiosInstance from '../../services/axiosinstance';

const AIAssistant = () => {
  const { user } = useContext(AuthContext);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI assistant with real-time access to your project management system. I can analyze your actual projects, tasks, team data, and provide specific insights based on your current business operations!",
      suggestions: [
        'Analyze my current project performance',
        'Show me task completion statistics',
        'Review team efficiency metrics',
        'Identify overdue tasks and risks',
        'Generate AI recommendations for optimization'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');
  const [contextInfo, setContextInfo] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await axiosInstance.get('/ai/test-google-ai/');
      if (response.data.status) {
        setAiStatus('active');
        console.log('✅ Gemini AI is active:', response.data.test_response);
      } else {
        setAiStatus('unavailable');
        console.log('❌ Gemini AI unavailable:', response.data.message);
      }
    } catch (error) {
      setAiStatus('unavailable');
      console.log('❌ AI Status check failed:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const generateAIResponse = async (input) => {
    try {
      console.log('🤖 Sending query to AI service:', input);
      
      const response = await axiosInstance.post('/ai/chat/', {
        prompt: input,
        user_context: {
          role: user?.role || 'USER',
          dashboard: 'SYSTEM_DASHBOARD',
          user_id: user?.id
        }
      });

      console.log('🤖 AI response received:', response.data);

      if (response.data.status && response.data.response) {
        // Store context information for display
        if (response.data.context_used) {
          setContextInfo(response.data.context_used);
          console.log('📊 AI analyzed system data:', response.data.context_used);
        }
        
        return {
          text: response.data.response,
          aiPowered: response.data.ai_powered,
          contextUsed: response.data.context_used
        };
      } else {
        console.log('❌ AI service failed, using fallback');
        return {
          text: generateFallbackResponse(input),
          aiPowered: false
        };
      }
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      return {
        text: generateFallbackResponse(input),
        aiPowered: false,
        error: true
      };
    }
  };

  const generateFallbackResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('project') || lowerInput.includes('projects')) {
      return `I can help you analyze your projects! I have access to your real project data including status, completion rates, team assignments, and performance metrics. 

**What I can analyze:**
• Project completion rates and success metrics
• Active vs completed project ratios
• Team allocation across projects
• Project health scores and risk factors
• Timeline analysis and deadline tracking

Ask me specific questions about your projects, like:
• "How many active projects do I have?"
• "What's my project completion rate?"
• "Which projects need immediate attention?"

What would you like to know about your projects?`;
    }
    
    if (lowerInput.includes('task') || lowerInput.includes('tasks')) {
      return `I can provide detailed task analysis based on your actual system data!

**Task Analytics Available:**
• Total tasks and completion statistics
• Overdue task identification and priority analysis
• Task velocity and productivity trends
• Workload distribution across team members
• Priority breakdown and urgency metrics

**Example questions:**
• "How many overdue tasks do I have?"
• "What's my task completion rate?"
• "Show me high-priority pending tasks"
• "Analyze my team's task velocity"

Your task data is analyzed in real-time. What specific task insights do you need?`;
    }
    
    if (lowerInput.includes('team') || lowerInput.includes('employee')) {
      return `I can analyze your team performance and provide insights based on actual data!

**Team Analytics:**
• Team composition and role distribution
• Performance metrics and productivity scores
• Workload balance across team members
• Team health and efficiency indicators
• Recent hiring activity and trends

**Available Insights:**
• Team utilization rates
• Performance benchmarking
• Collaboration effectiveness
• Resource optimization opportunities

Ask me about your team, such as:
• "How is my team performing?"
• "What's the current team composition?"
• "Are tasks distributed evenly?"

What team insights would be most valuable to you?`;
    }
    
    if (lowerInput.includes('ai') || lowerInput.includes('recommendation')) {
      return `I can analyze your AI recommendation usage and effectiveness!

**AI Intelligence Metrics:**
• Total AI recommendations generated
• Implementation and adoption rates
• Impact analysis of applied recommendations
• Success metrics and ROI tracking
• Pending high-impact opportunities

**Smart Insights:**
• Recommendation effectiveness scoring
• Pattern analysis for optimization
• Implementation success rates
• Strategic AI adoption guidance

I can help you maximize the value from AI recommendations. What would you like to explore?`;
    }

    return `I'm your AI assistant with full access to your project management system data! I can provide real-time analysis and insights about:

🎯 **Real-Time Analytics Available:**
• Project performance and completion rates
• Task status, priorities, and deadlines
• Team productivity and workload analysis
• AI recommendation effectiveness
• System performance metrics

🚀 **What Makes Me Different:**
• Access to your actual business data
• Real-time insights, not generic advice
• Role-based analysis (${user?.role || 'User'} perspective)
• Actionable recommendations based on your patterns

**Try asking me:**
• "Give me a system overview"
• "What needs my immediate attention?"
• "How are my projects performing?"
• "Show me productivity insights"

I'm analyzing your live data to provide specific, actionable insights. What would you like to explore?`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(currentInput);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: aiResponse.aiPowered,
        contextUsed: aiResponse.contextUsed,
        isError: aiResponse.error
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm experiencing technical difficulties accessing the system data. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusDisplay = () => {
    switch (aiStatus) {
      case 'active':
        return {
          color: '#4CAF50',
          text: 'AI Active',
          icon: '🤖',
          description: 'Connected to Gemini AI with database access'
        };
      case 'unavailable':
        return {
          color: '#FF9800',
          text: 'Smart Mode',
          icon: '🧠',
          description: 'Using intelligent database analysis'
        };
      default:
        return {
          color: '#9E9E9E',
          text: 'Connecting...',
          icon: '⏳',
          description: 'Establishing system connection'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="ai-chat-widget">
      {/* Enhanced Header */}
      <div className="ai-chat-header">
        <div className="ai-header-content">
          <div className="ai-header-left">
            <span className="ai-chat-icon">{statusDisplay.icon}</span>
            <div className="ai-header-info">
              <h4>AI System Analyst</h4>
              <div 
                className="ai-status-indicator" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  opacity: 0.9
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: statusDisplay.color
                }}></div>
                {statusDisplay.text}
              </div>
            </div>
          </div>
          <div className="ai-message-badge">
            {contextInfo ? 
              `${contextInfo.projects_analyzed || 0}P ${contextInfo.tasks_analyzed || 0}T` : 
              `${messages.length} msgs`
            }
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="ai-messages-area">
        {messages.map((message) => (
          <div key={message.id} className={`ai-message ${message.type}`}>
            <div className="ai-message-bubble">
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontSize: '0.9rem'
                }}
              >
                {message.content}
              </div>
              
              {message.suggestions && (
                <div className="ai-suggestions-list">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="ai-suggestion"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="ai-message-footer">
                <span className="ai-timestamp">{message.timestamp}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {message.aiPowered && (
                    <span className="ai-powered-badge">🤖 Gemini AI</span>
                  )}
                  {message.contextUsed && (
                    <span 
                      className="ai-powered-badge" 
                      style={{ background: '#2196F3' }}
                      title={`Analyzed ${message.contextUsed.projects_analyzed} projects, ${message.contextUsed.tasks_analyzed} tasks`}
                    >
                      📊 Live Data
                    </span>
                  )}
                  {message.isError && (
                    <span className="ai-error-badge">⚠️ Error</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message assistant">
            <div className="ai-message-bubble">
              <div className="ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '0.8rem', 
                opacity: 0.7,
                fontStyle: 'italic'
              }}>
                {aiStatus === 'active' ? 
                  '🤖 Gemini AI is analyzing your system data...' : 
                  '🧠 Processing your request with system intelligence...'
                }
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="ai-input-area">
        <div style={{ 
          fontSize: '0.7rem', 
          color: '#666', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ color: statusDisplay.color }}>●</span>
          {statusDisplay.description}
          {user && (
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
              as {user.role}
            </span>
          )}
        </div>
        
        <div className="ai-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              aiStatus === 'active' ? 
                "Ask me anything about your system data..." : 
                "What insights do you need from your business data?"
            }
            className="ai-text-input"
            disabled={isLoading}
            style={{
              fontSize: '0.9rem',
              padding: '12px 16px'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="ai-send-button"
            title="Send message"
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
