import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

/** Comma- or Enter-separated chips. Used for tech stacks and technologies. */
export function TagInput({ value, onChange, placeholder = "Type and press Enter" }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const parts = draft
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !value.includes(part));
    if (parts.length) onChange([...value, ...parts]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="rounded text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
      />
    </div>
  );
}
