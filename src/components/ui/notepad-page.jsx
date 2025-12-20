import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2, FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const NotepadPage = () => {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initial Data Load & Migration
  useEffect(() => {
    const savedNotes = localStorage.getItem("user_notepad_files");
    const oldNote = localStorage.getItem("user_notepad_content");

    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      if (parsedNotes.length > 0) {
        setActiveNoteId(parsedNotes[0].id);
      }
    } else if (oldNote) {
      // Migrate old single note
      const newNote = {
        id: Date.now().toString(),
        title: "My First Note",
        content: oldNote,
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote]);
      setActiveNoteId(newNote.id);
      localStorage.setItem("user_notepad_files", JSON.stringify([newNote]));
      // Optional: localStorage.removeItem("user_notepad_content"); 
    } else {
      // Start fresh
      createNewNote();
    }
  }, []);

  // Auto-save whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("user_notepad_files", JSON.stringify(notes));
    }
  }, [notes]);

  const createNewNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id) => {
    const remainingNotes = notes.filter((note) => note.id !== id);
    setNotes(remainingNotes);
    localStorage.setItem("user_notepad_files", JSON.stringify(remainingNotes));

    if (activeNoteId === id) {
      setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
    }
    
    if (remainingNotes.length === 0) {
       // Optionally don't force a new note immediately to allow empty state, 
       // but for a notepad app, immediately creating one is often better UX
       // setTimeout(() => createNewNote(), 0); 
    }
  };

  const updateActiveNote = (key, value) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === activeNoteId
          ? { ...note, [key]: value, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "w-64 border-r bg-muted/20 flex flex-col transition-all duration-300 ease-in-out absolute md:relative h-full z-10 bg-background md:bg-muted/20",
          !sidebarOpen && "-ml-64"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
                <StickyNote className="size-5 text-yellow-500" />
                <span>My Notes</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="size-4" />
            </Button>
        </div>
        
        <ScrollArea className="flex-1 p-3">
            <div className="space-y-1">
                {notes.map((note) => (
                    <button
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 group",
                            activeNoteId === note.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <FileText className="size-4 shrink-0 opacity-70" />
                        <span className="truncate flex-1">{note.title || "Untitled Note"}</span>
                    </button>
                ))}
            </div>
        </ScrollArea>

        <div className="p-4 border-t">
            <Button onClick={createNewNote} className="w-full gap-2">
                <Plus className="size-4" />
                New Note
            </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <header className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
                    <Menu className="size-5" />
                </Button>
                {activeNote ? (
                    <Input 
                        value={activeNote.title}
                        onChange={(e) => updateActiveNote("title", e.target.value)}
                        className="text-lg font-bold border-transparent hover:border-input focus:border-input bg-transparent w-[300px] px-2"
                        placeholder="Note Title"
                    />
                ) : (
                    <h1 className="text-lg font-bold px-2 text-muted-foreground">No Note Selected</h1>
                )}
            </div>
            {activeNote && (
                <div className="flex items-center gap-2">
                     <p className="text-xs text-muted-foreground hidden md:block mr-2">
                        Autosaved
                    </p>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        onClick={() => deleteNote(activeNote.id)}
                    >
                        <Trash2 className="size-5" />
                    </Button>
                </div>
            )}
        </header>

        <main className="flex-1 overflow-hidden relative">
            {activeNote ? (
                <Textarea
                    value={activeNote.content}
                    onChange={(e) => updateActiveNote("content", e.target.value)}
                    placeholder="Start writing..."
                    className="w-full h-full resize-none border-0 text-lg leading-relaxed focus-visible:ring-0 bg-transparent p-8 placeholder:text-muted-foreground/40"
                    autoFocus
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in">
                    <StickyNote className="size-16 opacity-20 mb-4" />
                    <p>Select a note or create a new one</p>
                    <Button variant="outline" className="mt-4 gap-2" onClick={createNewNote}>
                        <Plus className="size-4" />
                        Create Note
                    </Button>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default NotepadPage;
