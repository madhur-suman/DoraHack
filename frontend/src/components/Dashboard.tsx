import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from "../utils/api.js"
import { 
  User, 
  LogOut, 
  BarChart3, 
  Tag, 
  DollarSign,
  Upload,
  Database,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Star,
  Coins,
  Shield,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isCivicUser } = useAuth();
  
  // --- Start of API Integration ---

  // 1. State management for data, loading, and errors
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, insightsResponse] = await Promise.all([
          api.get('/api/receipts/statistics/'),
          api.get('/api/chat/insights/')
        ]);
        
        setStats(statsResponse.data);
        setInsights(insightsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // You can add state here to display an error message in the UI if needed
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Empty array ensures this runs only once on mount

  // 3. Dynamic data for summary cards, replacing the hardcoded values
  const summaryCards = [
    {
      title: "Total Receipts Processed",
      value: loading ? '...' : (stats?.total_receipts || 0),
      icon: BarChart3,
      gradient: "from-purple-400 to-blue-400"
    },
    {
      title: "Best Selling Item",
      value: loading ? '...' : (insights?.best_selling_item || 'N/A'),
      icon: Tag,
      gradient: "from-pink-400 to-purple-400"
    },
    {
      title: "Profit Earned",
      value: loading ? '...' : `$${stats?.profit_earned?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      gradient: "from-blue-400 to-cyan-400"
    }
  ];

  // --- End of API Integration ---

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // The rest of your UI data remains unchanged
  const featureCards = [
    {
      title: "Upload Receipts",
      description: "Drag and drop your receipts for instant processing",
      icon: Upload,
      route: "/upload",
      color: "text-purple-600"
    },
    {
      title: "Receipt Data",
      description: "View and manage your processed receipt data",
      icon: Database,
      route: "/data",
      color: "text-blue-600"
    },
    {
      title: "AI Assistant",
      description: "Get insights and answers about your receipts",
      icon: MessageSquare,
      route: "/ai-assistant",
      color: "text-pink-600"
    }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Advanced AI algorithms analyze your spending patterns and provide actionable insights to optimize your business operations."
    },
    {
      icon: Star,
      title: "Premium OCR Technology",
      description: "Industry-leading optical character recognition ensures 99.9% accuracy in extracting data from your receipts."
    },
    {
      icon: Coins,
      title: "Profit Optimization",
      description: "Track your most profitable items and categories to make data-driven decisions for your business growth."
    }
  ];

  // Your original JSX is returned below without any changes
  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="glass-panel m-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">ShopSense</h1>
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-2">
              {isCivicUser && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <Shield className="w-3 h-3" />
                  Civic
                </div>
              )}
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                <User className="w-4 h-4 mr-2" />
                {user?.name || user?.username || 'Me'}
                {isCivicUser && user?.walletAddress && (
                  <Wallet className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
            
            <Button 
              variant="default" 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {/* Main Heading */}
        <div className="text-center mb-8 animate-fade-up">
          <h2 className="text-4xl font-bold text-primary mb-2">Receipt Management</h2>
          <p className="text-muted-foreground text-lg">
            Streamline your receipt processing with AI-powered insights
          </p>
          {isCivicUser && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Secured with Civic Auth</span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-bounce-in">
          {summaryCards.map((card, index) => (
            <Card key={index} className="glass-card glass-hover p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-primary">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up">
          {featureCards.map((card, index) => (
            <Card key={index} className="glass-card glass-hover p-6 group cursor-pointer"
                  onClick={() => navigate(card.route)}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-4">
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{card.title}</h3>
                <p className="text-muted-foreground mb-4">{card.description}</p>
                <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 transition-colors">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Feature Descriptions */}
        <div className="glass-panel p-8 mb-8">
          <h3 className="text-2xl font-bold text-center text-primary mb-8">Why Choose ShopSense?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center animate-fade-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-primary mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="glass-card p-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <h4 className="font-semibold text-primary mb-2">Contact</h4>
              <p className="text-sm text-muted-foreground">support@shopsense.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Phone</h4>
              <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Address</h4>
              <p className="text-sm text-muted-foreground">123 Business Ave, Suite 100</p>
            </div>
          </div>
          <div className="border-t border-glass-border pt-4">
            <p className="text-sm text-muted-foreground">© 2024 ShopSense. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;