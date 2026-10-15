import { ShieldAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_USERNAME = "sujalsharma02";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="ambient" aria-hidden />
      <div className="surface w-full max-w-sm p-6 shadow-raised sm:p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Momentum OS</div>
            <div className="text-[11px] text-muted-foreground">Career operating system</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function UnlockForm() {
  const { unlock, username: storedUsername } = useAuth();
  const [username, setUsername] = useState(storedUsername ?? DEFAULT_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const problem = await unlock(username, password, false);
      if (problem) {
        setError(problem);
        setPassword("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <h1 className="text-base font-semibold">Sign in to Momentum OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your cloud login credentials configured in Vercel.</p>
      </div>
      <Field label="Username">
        <Input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Password">
        <Input
          autoFocus
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !password}>
        {busy ? "Checking…" : "Unlock"}
      </Button>
    </form>
  );
}

function Unsupported() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="h-4 w-4" />
        <h1 className="text-base font-semibold">Lock unavailable</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        The password lock needs the Web Crypto API, which browsers only expose on{" "}
        <code className="rounded bg-secondary px-1">https://</code> or{" "}
        <code className="rounded bg-secondary px-1">localhost</code>. Open the app from one of those
        to continue.
      </p>
    </div>
  );
}

/** Wraps the app: renders children only once the lock has been passed. */
export function LockGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "unlocked") return <>{children}</>;

  return (
    <Shell>
      {status === "setup" && <UnlockForm />}
      {status === "locked" && <UnlockForm />}
      {status === "unsupported" && <Unsupported />}
    </Shell>
  );
}
