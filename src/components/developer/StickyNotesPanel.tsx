import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Copy, Trash2, StickyNote, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StickyNote {
  id: string;
  title: string | null;
  content: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

const COLORS = [
  { name: "yellow", class: "bg-yellow-500/20 border-yellow-500/30" },
  { name: "green", class: "bg-green-500/20 border-green-500/30" },
  { name: "blue", class: "bg-blue-500/20 border-blue-500/30" },
  { name: "pink", class: "bg-pink-500/20 border-pink-500/30" },
  { name: "purple", class: "bg-purple-500/20 border-purple-500/30" },
];

const StickyNotesPanel = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "yellow",
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("sticky_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.error("Note content is required");
      return;
    }

    const { data, error } = await supabase
      .from("sticky_notes")
      .insert([{
        title: newNote.title || null,
        content: newNote.content,
        color: newNote.color,
      }])
      .select()
      .single();

    if (!error && data) {
      setNotes([data, ...notes]);
      setNewNote({ title: "", content: "", color: "yellow" });
      setDialogOpen(false);
      toast.success("Note added");
    } else {
      toast.error("Failed to add note");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;

    const { error } = await supabase
      .from("sticky_notes")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
      toast.success("Note deleted");
    } else {
      toast.error("Failed to delete note");
    }
  };

  const handleCopy = async (note: StickyNote) => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopiedId(note.id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const getColorClass = (color: string | null) => {
    const found = COLORS.find(c => c.name === color);
    return found?.class || COLORS[0].class;
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading notes...</div>;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <StickyNote className="w-4 h-4" />
          Quick Notes ({notes.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-yellow-500" />
            Quick Notes
          </DialogTitle>
        </DialogHeader>

        {/* Add New Note Form */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Input
                placeholder="Title (optional)"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <Textarea
                placeholder="Write your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.name}
                      className={`w-6 h-6 rounded-full border-2 ${color.class} ${
                        newNote.color === color.name ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                      }`}
                      onClick={() => setNewNote({ ...newNote, color: color.name })}
                    />
                  ))}
                </div>
                <Button onClick={handleAddNote} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map(note => (
              <Card key={note.id} className={`${getColorClass(note.color)} border relative group`}>
                <CardContent className="pt-4 pb-3">
                  {note.title && (
                    <h4 className="font-semibold mb-2 text-foreground">{note.title}</h4>
                  )}
                  <p className="text-sm whitespace-pre-wrap text-foreground/80">{note.content}</p>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleCopy(note)}
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No notes yet. Add your first note above!
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StickyNotesPanel;