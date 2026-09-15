import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/DataContext";
import { DOMAIN_META } from "@/data/prepTopics";
import { formatMediumDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TOPIC_STRENGTHS, type PrepTopic, type TopicStrength } from "@/types";
import { Markdown } from "@/features/notes/Markdown";

export const STRENGTH_META: Record<TopicStrength, { label: string; accent: string }> = {
  unrated: { label: "Unrated", accent: "#898791" },
  weak: { label: "Weak", accent: "#e66767" },
  developing: { label: "Developing", accent: "#c98500" },
  strong: { label: "Strong", accent: "#0ca30c" },
};

interface TopicDialogProps {
  topic: PrepTopic | null;
  onClose: () => void;
}

export function TopicDialog({ topic, onClose }: TopicDialogProps) {
  const { prep } = useData();
  const [newQuestion, setNewQuestion] = useState("");

  const state = topic ? prep.getProgress(topic.id) : null;
  const domain = topic ? DOMAIN_META[topic.domain] : null;

  const addQuestion = () => {
    if (!topic) return;
    prep.addQuestion(topic.id, newQuestion);
    setNewQuestion("");
  };

  return (
    <Dialog open={topic !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {topic && state && domain && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${domain.accent}1f`, color: domain.accent }}
                >
                  <DynamicIcon name={topic.icon} className="h-4 w-4" />
                </span>
                {topic.title}
              </DialogTitle>
              <DialogDescription>{topic.description}</DialogDescription>
            </DialogHeader>

            {/* Readiness + strength */}
            <div className="surface-muted grid gap-4 p-4 sm:grid-cols-[1fr,auto]">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">Readiness</span>
                  <span className="tabular text-muted-foreground">{state.readiness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={state.readiness}
                  onChange={(e) => prep.setReadiness(topic.id, Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                  aria-label="Readiness"
                />
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {state.lastStudied
                    ? `Last studied ${formatMediumDate(state.lastStudied)}`
                    : "Not studied yet"}
                  <button
                    type="button"
                    onClick={() => prep.markStudied(topic.id)}
                    className="ml-2 text-primary underline-offset-2 hover:underline"
                  >
                    Mark studied today
                  </button>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium">Self-assessment</div>
                <div className="flex gap-1">
                  {TOPIC_STRENGTHS.map((strength) => (
                    <button
                      key={strength}
                      type="button"
                      onClick={() => prep.setStrength(topic.id, strength)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        state.strength === strength
                          ? "border-transparent text-white"
                          : "border-border text-muted-foreground hover:bg-elevated",
                      )}
                      style={
                        state.strength === strength
                          ? { backgroundColor: STRENGTH_META[strength].accent }
                          : undefined
                      }
                    >
                      {STRENGTH_META[strength].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="questions">
                  Questions
                  {state.questions.length > 0 && (
                    <span className="tabular text-muted-foreground">
                      {state.questions.filter((q) => q.answered).length}/{state.questions.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="notes">
                <Textarea
                  value={state.notes}
                  onChange={(e) => prep.setNotes(topic.id, e.target.value)}
                  placeholder={`# ${topic.title}\n\nKey concepts, gotchas, things you got wrong...\n\nMarkdown supported. Saved automatically.`}
                  className="min-h-[300px] font-mono text-xs"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[300px] rounded-md border border-border p-4">
                  <Markdown content={state.notes || "*Nothing written yet.*"} />
                </div>
              </TabsContent>
              <TabsContent value="questions">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addQuestion();
                        }
                      }}
                      placeholder="A question you were asked, or expect to be"
                    />
                    <Button onClick={addQuestion} disabled={!newQuestion.trim()}>
                      <Plus /> Add
                    </Button>
                  </div>
                  {state.questions.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Collect real interview questions here and tick them once you can answer out loud.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/60 rounded-md border border-border">
                      {state.questions.map((question) => (
                        <li key={question.id} className="group flex items-start gap-2.5 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => prep.toggleQuestion(topic.id, question.id)}
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              question.answered
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40 hover:border-primary",
                            )}
                            aria-label={question.answered ? "Mark unanswered" : "Mark answered"}
                          >
                            {question.answered && <Check className="h-3 w-3" />}
                          </button>
                          <span className={cn("flex-1 text-sm", question.answered && "text-muted-foreground line-through")}>
                            {question.prompt}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 hover:text-destructive group-hover:opacity-100"
                            onClick={() => prep.removeQuestion(topic.id, question.id)}
                            aria-label="Remove question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
