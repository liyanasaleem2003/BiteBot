import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useTheme } from "../hooks/use-theme";
import {
  Brain,
  Heart,
  MoonIcon,
  SunIcon,
  UserCircle2,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/user-info");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            BiteBot
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Your Personal Cultural Nutrition Guide
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Discover personalized nutrition and wellness advice that respects
            your cultural heritage while supporting your health goals.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            disabled={isLoading}
            className="animate-pulse hover:animate-none"
          >
            {isLoading ? "Loading..." : "Get Started"}
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
         

          <Card className="p-6 hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <Utensils className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Personalized Meal Plans
            </h3>
            <p className="text-muted-foreground">
              Get culturally relevant meal plans tailored to your preferences
              and health goals.
            </p>
          </Card>
        <Card className="p-6 hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Advice</h3>
            <p className="text-muted-foreground">
              Chat with BiteBot for instant, culturally-aware nutrition and
              cooking guidance.
            </p>
          </Card>
          <Card className="p-6 hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Wellness Guidance</h3>
            <p className="text-muted-foreground">
              Access personalized wellness tips that blend modern health science
              with cultural practices.
            </p>
          </Card>

          
        </div>

        {/* Cultural Pattern Decoration */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl" />
          <div className="relative p-8 text-center">
            <UserCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-semibold mb-4">
              Join Our Growing Community
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join 1000s of people, also on their wellness journey maintaining
              their cultural identity. Start your personalized experience today.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BiteBot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
