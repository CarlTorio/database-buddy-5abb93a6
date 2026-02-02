import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import ContactsTable from "@/components/ContactsTable";
import Phase2ContactsTable from "@/components/Phase2ContactsTable";
import Phase3ContactsTable from "@/components/Phase3ContactsTable";
import EmailTemplateDialog from "@/components/EmailTemplateDialog";
import CompletedClientsDialog from "@/components/CompletedClientsDialog";
import RejectedClientsDialog from "@/components/RejectedClientsDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
interface Category {
  id: string;
  name: string;
  created_at: string;
}
const CRM = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [phase2RefreshKey, setPhase2RefreshKey] = useState(0);
  const [phase3RefreshKey, setPhase3RefreshKey] = useState(0);
  const handlePhase2Refresh = () => {
    setPhase2RefreshKey(prev => prev + 1);
  };
  const handlePhase3Refresh = () => {
    setPhase3RefreshKey(prev => prev + 1);
  };
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    const {
      data,
      error
    } = await supabase.from("contact_categories").select("*").order("created_at", {
      ascending: false
    });
    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const {
      data,
      error
    } = await supabase.from("contact_categories").insert({
      name: newCategoryName.trim()
    }).select().single();
    if (!error && data) {
      setCategories([data, ...categories]);
      setNewCategoryName("");
    }
  };
  const handleDeleteCategory = async (id: string) => {
    const {
      error
    } = await supabase.from("contact_categories").delete().eq("id", id);
    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };
  if (selectedCategory) {
    return <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 px-4 lg:px-8 pb-8">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => {
              setSelectedCategory(null);
              setIsAddingContact(false);
            }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
              <div className="flex gap-2">
                <CompletedClientsDialog categoryId={selectedCategory.id} />
                <RejectedClientsDialog categoryId={selectedCategory.id} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-8">
              {selectedCategory.name}
            </h1>
            
            {/* Phase 1: Lead Stage */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-center text-foreground mb-4">Phase 1: Lead Stage</h2>
              <ContactsTable categoryId={selectedCategory.id} onContactMovedToPhase2={handlePhase2Refresh} />
            </div>

            {/* Phase 2: Presentation */}
            <div className="mb-8">
              <h2 className="font-bold text-center text-foreground mb-4 text-lg">Phase 2: Presentation</h2>
              <Phase2ContactsTable key={phase2RefreshKey} categoryId={selectedCategory.id} onContactMovedToPhase3={handlePhase3Refresh} />
            </div>

            {/* Phase 3: Conversion */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-center text-foreground mb-4">Phase 3: Conversion</h2>
              <Phase3ContactsTable key={phase3RefreshKey} categoryId={selectedCategory.id} />
            </div>
          </div>
        </main>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 px-4 lg:px-8">
        <div className="w-full">
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Contact Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Select a category or create a new one to manage your contacts
              </p>
            </div>
          </div>

          {/* Add Category */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Create New Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input placeholder="e.g., Dental Clinics, Barbershops..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategory()} />
                <Button onClick={handleAddCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          {loading ? <div className="text-center text-muted-foreground py-12">
              Loading categories...
            </div> : categories.length === 0 ? <div className="text-center text-muted-foreground py-12">
              No categories yet. Create one above to get started!
            </div> : <div className="flex flex-col gap-3">
              {categories.map(category => <Card key={category.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setSelectedCategory(category)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Click to manage contacts
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={e => {
                e.stopPropagation();
                handleDeleteCategory(category.id);
              }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>)}
            </div>}
        </div>
      </main>
      <Footer />
    </div>;
};
export default CRM;