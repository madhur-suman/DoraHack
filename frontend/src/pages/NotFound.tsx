import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="glass-card p-8 max-w-md w-full text-center animate-fade-up">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-destructive/20 to-warning/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button 
          onClick={() => window.location.href = '/'} 
          className="bg-primary hover:bg-primary/90"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;
