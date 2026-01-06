import { Zap, Shield, Sparkles } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
          <div className="glass-card p-6 rounded-xl space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Real-Time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Monitor credit usage and data flows with instant updates and live dashboards.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Secure Data Storage</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade encryption and compliance for all your sensitive data.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Smart Automation</h3>
            <p className="text-sm text-muted-foreground">
              Automate credit allocation and data workflows with intelligent tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
