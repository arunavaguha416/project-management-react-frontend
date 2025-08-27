// src/components/ai/AIAssistant.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/auth-context';
import { aiService } from '../../services/ai/aiService';

const AIAssistant = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const fetchUserInsights = useCallback(async () => {
    try {
      let insightsData;
      
      if (!user) return;
      
      // Fetch role-specific insights
      switch (user.role) {
        case 'HR':
          insightsData = await aiService.getHRInsights();
          break;
        case 'MANAGER':
          insightsData = await aiService.getManagerInsights();
          break;
        default:
          insightsData = await aiService.getEmployeeInsights();
      }
      
      if (insightsData.status) {
        setInsights(insightsData.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  }, [user]);

  // Initialize with welcome message and fetch insights
  useEffect(() => {
    if (user?.name) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'assistant',
        message: `Hello ${user.name}! I'm your AI Project Management Assistant. I can help you with:

• Project health analysis
• Resource optimization suggestions  
• Risk assessment and mitigation
• Performance insights
• Workflow recommendations

What would you like to know about your projects?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      fetchUserInsights();
    }
  }, [fetchUserInsights, user?.name]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response based on message content
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('health') || lowerMessage.includes('status')) {
      return `Based on your current projects, I can see that overall project health is performing well. Here are some key insights:

• Average project health score: ${insights?.avg_project_health || 85}%
• ${insights?.active_insights || 3} active insights detected
• Team efficiency: ${insights?.avg_team_efficiency || 88}%

Would you like me to analyze a specific project or provide recommendations for improvement?`;
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return `Here are my top recommendations based on your current project data:

🎯 **Resource Optimization**: Consider reallocating 2 developers from Project A to Project B for better skill utilization
⚡ **Process Improvement**: Implement automated testing to reduce QA bottlenecks by 25%
📊 **Performance Boost**: Schedule weekly sprint reviews to improve team velocity
🔍 **Risk Mitigation**: Monitor Project C closely - showing 15% timeline risk

Would you like detailed analysis on any of these recommendations?`;
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('member')) {
      return `Team analysis shows:

👥 **Team Performance**: ${insights?.team_efficiency || 85}% overall efficiency
📈 **Productivity Trends**: 12% improvement over last month  
🎯 **Skill Matching**: 92% optimal skill allocation
⚠️ **Workload Balance**: 1 team member showing high utilization

I can provide specific team member recommendations or workload balancing suggestions. What specific aspect would you like me to analyze?`;
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('problem')) {
      return `Current risk analysis reveals:

🚨 **High Priority Risks**:
• Timeline delays in 2 projects (confidence: 87%)
• Resource shortage in backend team (confidence: 76%)

⚠️ **Medium Priority Risks**:
• Budget overrun potential in Project X (confidence: 64%)
• Quality concerns in sprint deliverables (confidence: 58%)

I recommend immediate action on high-priority risks. Would you like specific mitigation strategies?`;
    }

    // Default response
    return `I understand you're asking about "${message}". Let me help you with that.

Based on your role as ${user?.role}, I can provide insights on:
• Project performance metrics
• Team productivity analysis  
• Resource allocation optimization
• Risk assessment and predictions
• Workflow improvement suggestions

Could you be more specific about what aspect you'd like me to analyze? For example, you could ask:
• "How are my projects performing?"
• "What are the current risks?"
• "How can I optimize my team?"
• "Show me performance trends"`;
  }, [insights, user?.role]);

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const quickActions = [
    "How are my projects performing?",
    "What are the current risks?",
    "Show me team efficiency",
    "Recommend optimizations"
  ];

  return (
    <div className="ai-components-container">
      {/* Header */}
      <div className="ai-header-content">
        <div className="ai-header-info">
          <h2 className="ai-page-title">AI Assistant</h2>
          <p className="ai-page-subtitle">Your intelligent project management companion</p>
        </div>
        <div className="ai-header-status">
          <div className="ai-status-indicator online"></div>
          <span>AI Assistant Online</span>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="ai-dashboard-grid">
        <div className="ai-dashboard-card ai-chat-card">
          <div className="ai-card-header">
            <h3>Chat with AI Assistant</h3>
            <div className="ai-chat-info">
              <span>{messages.length} messages</span>
            </div>
          </div>
          
          <div className="ai-chat-container">
            <div className="ai-chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-chat-message ${msg.type}`}>
                  <div className="ai-message-avatar">
                    {msg.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-message-text">
                      {msg.message.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < msg.message.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="ai-message-time">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="ai-chat-message assistant">
                  <div className="ai-message-avatar">🤖</div>
                  <div className="ai-message-content">
                    <div className="ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ai-chat-input">
              <div className="ai-quick-actions">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="ai-quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
              
              <div className="ai-input-container">
                <input
                  type="text"
                  className="ai-message-input"
                  placeholder="Ask me anything about your projects..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <button
                  className="ai-send-btn"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        {insights && (
          <div className="ai-dashboard-card ai-insights-panel">
            <div className="ai-card-header">
              <h3>Current Insights</h3>
            </div>
            <div className="ai-card-content">
              <div className="ai-insights-grid">
                {user?.role === 'MANAGER' && (
                  <>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">⚡</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.teamEfficiency}%</span>
                        <span className="ai-insight-label">Team Efficiency</span>
                      </div>
                    </div>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">🎯</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.aiRecommendations}</span>
                        <span className="ai-insight-label">Active Recommendations</span>
                      </div>
                    </div>
                  </>
                )}
                
                {user?.role === 'HR' && (
                  <>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">📊</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.hrEfficiency}%</span>
                        <span className="ai-insight-label">HR Efficiency</span>
                      </div>
                    </div>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">🤖</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.automatedTasks}</span>
                        <span className="ai-insight-label">Automated Tasks</span>
                      </div>
                    </div>
                  </>
                )}
                
                {user?.role === 'USER' && (
                  <>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">📈</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.productivity}%</span>
                        <span className="ai-insight-label">Productivity Score</span>
                      </div>
                    </div>
                    <div className="ai-insight-item">
                      <div className="ai-insight-icon">🎯</div>
                      <div className="ai-insight-text">
                        <span className="ai-insight-value">{insights.taskOptimization}</span>
                        <span className="ai-insight-label">Task Optimizations</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
