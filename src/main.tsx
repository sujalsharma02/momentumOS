import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { runMigrations } from "@/lib/migrate";
import "@/index.css";

// Storage is brought up to the current schema before anything reads it, so no
// component ever sees a half-migrated shape.
runMigrations();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
