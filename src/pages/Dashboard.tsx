import UserCreditsTable from "@/components/UserCreditsTable";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
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
    </div>
  );
};

export default Dashboard;
