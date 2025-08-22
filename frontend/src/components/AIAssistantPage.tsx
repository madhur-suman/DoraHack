import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from "../utils/api.js"
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Bot,
  User,
  Sparkles,
  FileText,
  BarChart3,
  TrendingUp,
  Loader2 // Added for loading state
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  
  // --- Start of API Integration ---

  const [loading, setLoading] = useState(false);
  // We will display errors as an AI message, so a separate error state is not needed for the UI.
  
  // Start with only the initial AI greeting
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your ShopSense AI Assistant. I can help you analyze your receipt data, find spending patterns, and provide insights about your business. What would you like to know?',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Ref for the chat container to auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessageContent = message.trim();

    // 1. Add the user's message to the UI immediately
    const newUserMessage: Message = {
      id: Date.now(), // Use timestamp for a more robust unique key
      type: 'user',
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    setMessages(prev => [...prev, newUserMessage]);
    setMessage('');
    setLoading(true);

    // 2. Make the API call
    try {
      const result = await api.post('/api/chat/query/', {
        query: userMessageContent
      });
      
      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.data.response,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error processing your question.';
      const errorResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  // --- End of API Integration ---


  const quickActions = [
    {
      icon: BarChart3,
      label: "Show spending trends",
      action: "Show me my spending trends over the last 3 months"
    },
    {
      icon: TrendingUp,
      label: "Profit analysis",
      action: "Analyze my profit margins by category"
    },
    {
      icon: FileText,
      label: "Recent receipts",
      action: "What are my most recent receipt uploads?"
    },
    {
      icon: Sparkles,
      label: "Optimization tips",
      action: "Give me tips to optimize my business expenses"
    }
  ];

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="glass-panel m-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">AI Assistant</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <Card className="glass-card p-4 mb-4 animate-fade-up">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAction(action.action)}
                  className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-primary/10 text-center"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{action.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Chat Messages */}
          <Card className="glass-card mb-4 animate-bounce-in">
            <div ref={chatContainerRef} className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-up ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.type === 'ai' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-glass border border-glass-border'
                    }`}
                  >
                    <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                      msg.type === 'user' ? 'prose-invert' : ''
                    }`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className="my-1">{line}</p>
                      ))}
                    </div>
                    <p className={`text-xs mt-2 ${
                      msg.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
               {loading && (
                <div className="flex gap-3 justify-start animate-fade-up">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[70%] p-4 rounded-2xl bg-glass border border-glass-border flex items-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-glass-border p-4">
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 flex-shrink-0" disabled={loading}>
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </Button>
                
                <Input
                  placeholder="Ask me about your receipts, spending patterns, or business insights..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1 bg-glass border-glass-border focus:border-primary"
                />
                
                <Button 
                  onClick={handleSend}
                  disabled={!message.trim() || loading}
                  className="bg-primary hover:bg-primary/90 flex-shrink-0 w-10"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;