import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountsManagement from "@/components/AccountsManagement";
import CompensationCalculator from "@/components/compensation/CompensationCalculator";

const Compensation = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Sub Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Compensation Portal</h1>
              <p className="text-muted-foreground text-sm">Track salaries, commissions & company earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="w-4 h-4" />
              Compensation Calculator
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Users className="w-4 h-4" />
              Account Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <CompensationCalculator />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsManagement />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Compensation;