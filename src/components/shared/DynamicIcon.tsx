import { icons, type LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

/** Renders a lucide icon from its PascalCase name (used by data-driven configs). */
export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon {...props} />;
}
