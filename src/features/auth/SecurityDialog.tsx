import { Download, KeyRound, Lock, ShieldOff, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { listKeys, readRaw, STORAGE_KEYS } from "@/lib/storage";

const MIN_PASSWORD = 8;

/** Downloads every stored collection as one JSON file (lock record excluded). */
function exportBackup() {
  const skip = new Set<string>([STORAGE_KEYS.lock, STORAGE_KEYS.sessionUntil, STORAGE_KEYS.lockFailures]);
  const payload: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  for (const key of listKeys()) {
    if (skip.has(key)) continue;
    payload[key] = readRaw(key);
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `momentum-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface SecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityDialog({ open, onOpenChange }: SecurityDialogProps) {
  const { username, lock, changePassword, disable } = useAuth();
  const { resetAllData } = useData();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirmNext("");
  };

  const onChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (next.length < MIN_PASSWORD) return setMessage({ tone: "error", text: `Use at least ${MIN_PASSWORD} characters.` });
    if (next !== confirmNext) return setMessage({ tone: "error", text: "New passwords do not match." });
    setBusy(true);
    try {
      const problem = await changePassword(current, next);
      setMessage(problem ? { tone: "error", text: problem } : { tone: "ok", text: "Password updated." });
      if (!problem) reset();
    } finally {
      setBusy(false);
    }
  };

  const onDisable = () =>
    confirm({
      title: "Remove the lock?",
      description: "Anyone who opens this browser will be able to use the app. Your current password is required.",
      confirmLabel: "Remove lock",
      onConfirm: async () => {
        const problem = await disable(current);
        setMessage(problem ? { tone: "error", text: problem } : null);
      },
    });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value);
          if (!value) {
            reset();
            setMessage(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Security & data</DialogTitle>
            <DialogDescription>
              Signed in as <span className="font-medium text-foreground">{username}</span>. Everything is
              stored in this browser only.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" size="sm" onClick={() => { lock(); onOpenChange(false); }}>
              <Lock /> Lock now
            </Button>
            <Button variant="outline" size="sm" onClick={exportBackup}>
              <Download /> Export backup (JSON)
            </Button>
          </div>

          <form onSubmit={onChangePassword} className="grid gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-muted-foreground" /> Change password
            </div>
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="New password">
                <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
              </Field>
              <Field label="Confirm new">
                <Input type="password" autoComplete="new-password" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} />
              </Field>
            </div>
            {message && (
              <p className={message.tone === "ok" ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-destructive"}>
                {message.text}
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onDisable} disabled={!current}>
                <ShieldOff /> Remove lock
              </Button>
              <Button type="submit" size="sm" disabled={busy || !current || !next}>
                {busy ? "Saving…" : "Update password"}
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                confirm({
                  title: "Erase all data?",
                  description: "Applications, projects, logs, plans, goals and notes will be deleted from this browser. The lock stays. Export a backup first.",
                  confirmLabel: "Erase everything",
                  onConfirm: resetAllData,
                })
              }
            >
              <Trash2 /> Erase all data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}
