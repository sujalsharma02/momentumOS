import { Pencil, Plus, Quote, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/DataContext";
import { QUOTES } from "@/data/quotes";
import { MILESTONE_STATUS_META } from "@/features/roadmap/MilestoneDialog";

function randomQuoteIndex(exclude?: number): number {
  let index = Math.floor(Math.random() * QUOTES.length);
  if (index === exclude) index = (index + 1) % QUOTES.length;
  return index;
}

export function WhyPage() {
  const { reasons, roadmap } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [quoteIndex, setQuoteIndex] = useState(() => randomQuoteIndex());
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const quote = QUOTES[quoteIndex];
  const active = roadmap.items.find((m) => m.status === "active");
  const later = roadmap.items.filter((m) => m.status !== "done" && m.status !== "active");

  const addReason = () => {
    if (!draft.trim()) return;
    reasons.create({ text: draft });
    setDraft("");
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) reasons.update(editingId, { text: editingText.trim() });
    setEditingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Why"
        description="For the weeks when the pipeline is quiet. Your own reasons, in your own words."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="eyebrow mb-3">Reasons</h2>
            {reasons.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing written yet. What is all this effort actually for?</p>
            ) : (
              <ol className="space-y-2">
                {reasons.items.map((reason, index) => (
                  <li key={reason.id} className="group flex items-start gap-3">
                    <span className="tabular mt-0.5 w-5 shrink-0 text-xs font-semibold text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {editingId === reason.id ? (
                      <div className="flex flex-1 gap-2">
                        <Input
                          autoFocus
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button size="sm" onClick={saveEdit}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm leading-relaxed">{reason.text}</p>
                        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingId(reason.id);
                              setEditingText(reason.text);
                            }}
                            aria-label="Edit reason"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:text-destructive"
                            onClick={() => confirm({ title: "Remove this reason?", onConfirm: () => reasons.remove(reason.id) })}
                            aria-label="Remove reason"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-4 flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addReason();
                }}
                placeholder="Add a reason"
              />
              <Button onClick={addReason} disabled={!draft.trim()}>
                <Plus /> Add
              </Button>
            </div>
          </section>

          <section className="surface p-5">
            <div className="flex items-start gap-3">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <blockquote className="text-sm leading-relaxed">{quote.text}</blockquote>
                <p className="mt-1 text-xs text-muted-foreground">{quote.author}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setQuoteIndex((current) => randomQuoteIndex(current))} aria-label="Another quote">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>
        </div>

        <aside className="surface p-5">
          <h2 className="eyebrow mb-3">Direction</h2>
          {active ? (
            <>
              <div className="text-[11px] font-medium" style={{ color: MILESTONE_STATUS_META.active.accent }}>
                Working on
              </div>
              <div className="mt-0.5 text-sm font-semibold">{active.title}</div>
              {active.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{active.detail}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No active milestone.</p>
          )}
          {later.length > 0 && (
            <ol className="mt-4 space-y-1.5 border-t border-border pt-3">
              {later.map((m) => (
                <li key={m.id} className="text-xs text-muted-foreground">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MILESTONE_STATUS_META[m.status].accent }} />
                  {m.title}
                </li>
              ))}
            </ol>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link to="/roadmap">Open roadmap</Link>
          </Button>
        </aside>
      </div>
      {confirmDialog}
    </div>
  );
}
