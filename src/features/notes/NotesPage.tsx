import { motion } from "framer-motion";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { Markdown } from "@/features/notes/Markdown";

export function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useData();
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [notes, activeId],
  );

  const handleCreate = () => {
    const note = addNote("Untitled note");
    setActiveId(note.id);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    if (activeId === id) {
      setActiveId(notes.find((note) => note.id !== id)?.id ?? null);
    }
  };

  if (notes.length === 0) {
    return (
      <div>
        <PageHeader title="Notes" description="Markdown notes for interviews, learnings, and everything between." />
        <EmptyState
          icon="NotebookPen"
          title="No notes yet"
          description="Capture interview questions, concepts you struggled with, and answers worth rehearsing."
          action={
            <Button onClick={handleCreate}>
              <Plus /> New note
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Markdown notes for interviews, learnings, and everything between."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> New note
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        {/* Note list */}
        <div className="glass max-h-[32vh] overflow-y-auto rounded-xl p-2 lg:max-h-[70vh]">
          {notes.map((note) => (
            <motion.button
              key={note.id}
              type="button"
              layout
              onClick={() => setActiveId(note.id)}
              className={cn(
                "group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                note.id === activeId ? "border border-primary/25 bg-primary/10" : "hover:bg-white/[0.04]",
              )}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{note.title || "Untitled"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(note.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    handleDelete(note.id);
                  }
                }}
                aria-label={`Delete ${note.title}`}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          ))}
        </div>

        {/* Editor */}
        {activeNote ? (
          <div className="glass rounded-xl p-4">
            <Input
              value={activeNote.title}
              onChange={(event) => updateNote(activeNote.id, { title: event.target.value })}
              placeholder="Note title"
              className="border-0 bg-transparent px-1 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
            <Tabs defaultValue="write" className="mt-2">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={activeNote.content}
                  onChange={(event) => updateNote(activeNote.id, { content: event.target.value })}
                  placeholder={"# Heading\n\n- bullet points\n- **bold**, *italic*, `code`\n\n> Everything autosaves."}
                  className="min-h-[52vh] resize-y border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[52vh] px-1 py-2">
                  <Markdown content={activeNote.content || "*Nothing to preview yet.*"} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="glass flex items-center justify-center rounded-xl text-sm text-muted-foreground">
            Select a note
          </div>
        )}
      </div>
    </div>
  );
}
