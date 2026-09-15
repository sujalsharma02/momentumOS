import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { Markdown } from "@/features/notes/Markdown";

export function NotesPage() {
  const { notes } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [activeId, setActiveId] = useState<string | null>(notes.items[0]?.id ?? null);
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => [...notes.items].sort((a, b) => b.updatedAt - a.updatedAt), [notes.items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [sorted, query]);

  const activeNote = notes.items.find((note) => note.id === activeId) ?? null;

  const handleCreate = () => {
    const note = notes.create("Untitled note");
    setActiveId(note.id);
  };

  const requestDelete = (id: string, title: string) =>
    confirm({
      title: `Delete "${title || "Untitled"}"?`,
      onConfirm: () => {
        notes.remove(id);
        if (activeId === id) setActiveId(sorted.find((note) => note.id !== id)?.id ?? null);
      },
    });

  if (notes.items.length === 0) {
    return (
      <div>
        <PageHeader title="Notes" description="A markdown scratchpad for anything that does not fit elsewhere." />
        <EmptyState
          icon="FileText"
          title="No notes yet"
          description="Interview debriefs, offer comparisons, things to say in a negotiation. Structured topic notes live in Interview Prep; this is for everything else."
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
        description="A markdown scratchpad for anything that does not fit elsewhere."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> New note
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
        <div className="surface flex max-h-[36vh] flex-col lg:max-h-[72vh]">
          <div className="relative border-b border-border p-2">
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="h-8 pl-8 text-xs" />
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {visible.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors",
                  note.id === activeId ? "bg-accent" : "hover:bg-elevated",
                )}
              >
                <button type="button" onClick={() => setActiveId(note.id)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{note.title || "Untitled"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 shrink-0 opacity-0 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                  onClick={() => requestDelete(note.id, note.title)}
                  aria-label={`Delete ${note.title || "note"}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {visible.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">No matches.</p>}
          </div>
        </div>

        {activeNote ? (
          <div className="surface p-4">
            <Input
              value={activeNote.title}
              onChange={(event) => notes.update(activeNote.id, { title: event.target.value, updatedAt: Date.now() })}
              placeholder="Note title"
              className="h-auto border-0 bg-transparent px-1 py-0 text-base font-semibold focus-visible:ring-0"
            />
            <Tabs defaultValue="write" className="mt-2">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={activeNote.content}
                  onChange={(event) => notes.update(activeNote.id, { content: event.target.value, updatedAt: Date.now() })}
                  placeholder={"# Heading\n\n- bullet points\n- **bold**, *italic*, `code`\n\nEverything autosaves."}
                  className="min-h-[56vh] resize-y border-0 bg-transparent px-1 font-mono text-xs focus-visible:ring-0"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[56vh] px-1 py-2">
                  <Markdown content={activeNote.content || "*Nothing to preview yet.*"} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="surface flex items-center justify-center text-sm text-muted-foreground">Select a note</div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
