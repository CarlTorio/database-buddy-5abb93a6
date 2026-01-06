import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import ContactsTable from "@/components/ContactsTable";
import EmailTemplateDialog from "@/components/EmailTemplateDialog";

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("contact_categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from("contact_categories")
      .insert({ name: newCategoryName.trim() })
      .select()
      .single();

    if (!error && data) {
      setCategories([data, ...categories]);
      setNewCategoryName("");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("contact_categories")
      .delete()
      .eq("id", id);

    if (!error) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 lg:px-8">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategory(null);
                setIsAddingContact(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
            <EmailTemplateDialog />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {selectedCategory.name}
          </h1>
          <ContactsTable
            categoryId={selectedCategory.id}
            isAdding={isAddingContact}
            onAddingChange={setIsAddingContact}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block">
              ← Back to Home
            </Link>
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
              <Input
                placeholder="e.g., Dental Clinics, Barbershops..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No categories yet. Create one above to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group relative"
              >
                <CardContent
                  className="p-6"
                  onClick={() => setSelectedCategory(category)}
                >
                  <h3 className="text-xl font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to manage contacts
                  </p>
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CRM;
