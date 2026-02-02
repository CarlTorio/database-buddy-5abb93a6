import Navbar from "@/components/Navbar";
import DeveloperProjectsTable from "@/components/developer/DeveloperProjectsTable";
import StickyNotesPanel from "@/components/developer/StickyNotesPanel";
import UserCreditsTable from "@/components/UserCreditsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Mail, StickyNote } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Developer Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your projects, emails, and quick notes
              </p>
            </div>
            <StickyNotesPanel />
          </div>

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="projects" className="gap-2">
                <Code2 className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="w-4 h-4" />
                Email Credits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <DeveloperProjectsTable />
            </TabsContent>

            <TabsContent value="emails">
              <UserCreditsTable />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;