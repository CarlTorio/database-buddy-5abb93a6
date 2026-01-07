import UserCreditsTable from "@/components/UserCreditsTable";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              User Credits Dashboard
            </h1>
            <p className="text-muted-foreground text-center">
              Manage and monitor user credits and monthly allocations
            </p>
          </div>
          <UserCreditsTable />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
