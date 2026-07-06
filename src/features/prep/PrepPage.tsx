import { motion } from "framer-motion";
import { NotebookPen } from "lucide-react";
import { useState } from "react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/DataContext";
import { PREP_TOPICS } from "@/data/prepTopics";
import { Markdown } from "@/features/notes/Markdown";
import type { PrepTopic } from "@/types";

export function PrepPage() {
  const { prepNotes, setPrepNote } = useData();
  const [activeTopic, setActiveTopic] = useState<PrepTopic | null>(null);

  return (
    <div>
      <PageHeader
        title="Interview Preparation"
        description="Ten pillars of the AI Full Stack interview. Open a card to build your notes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PREP_TOPICS.map((topic, index) => {
          const noteLength = (prepNotes[topic.id] ?? "").trim().length;
          return (
            <motion.button
              key={topic.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => setActiveTopic(topic)}
              className="glass glass-hover rounded-xl p-5 text-left"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${topic.accent}22`, color: topic.accent }}
                >
                  <DynamicIcon name={topic.icon} className="h-5 w-5" />
                </div>
                {noteLength > 0 && (
                  <Badge variant="success">
                    <NotebookPen className="h-3 w-3" />
                    notes
                  </Badge>
                )}
              </div>
              <h3 className="mt-3 font-semibold">{topic.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
            </motion.button>
          );
        })}
      </div>

      <Dialog open={activeTopic !== null} onOpenChange={(open) => !open && setActiveTopic(null)}>
        <DialogContent className="max-w-2xl">
          {activeTopic && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${activeTopic.accent}22`, color: activeTopic.accent }}
                  >
                    <DynamicIcon name={activeTopic.icon} className="h-4 w-4" />
                  </span>
                  {activeTopic.title} notes
                </DialogTitle>
                <DialogDescription>
                  Markdown supported — saved automatically to this device.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="write">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <Textarea
                    autoFocus
                    value={prepNotes[activeTopic.id] ?? ""}
                    onChange={(event) => setPrepNote(activeTopic.id, event.target.value)}
                    placeholder={`# ${activeTopic.title}\n\nKey concepts, gotchas, questions you were asked…`}
                    className="min-h-[320px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[320px] rounded-md border border-border p-4">
                    <Markdown content={prepNotes[activeTopic.id] ?? "*Nothing here yet — switch to Write.*"} />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setActiveTopic(null)}>
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
