import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
const HeroSection = () => {
  return <section className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{
      animationDelay: "1s"
    }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          {/* Badge */}
          

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground animate-fade-in" style={{
          animationDelay: "0.1s"
        }}>
             Data & Account  
            <span className="block text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent pb-[8px]">Management Hub</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
            Private workspace for our team to manage data, track credits, and access internal tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{
          animationDelay: "0.3s"
        }}>
            <Button asChild size="lg" className="glow-effect group">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="group">
              <Link to="/crm">
                Manage Contacts
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 hover:bg-white/5">
              <a href="#tools">Explore Tools</a>
            </Button>
          </div>

        </div>
      </div>
    </section>;
};
export default HeroSection;