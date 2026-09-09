import type { HTMLAttributes } from "react";

type StatusTone = "ready" | "muted" | "warning" | "missing" | "frozen";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
};

export function StatusBadge({ tone = "muted", className = "", ...props }: StatusBadgeProps) {
  return <span className={`status status-${tone} ${className}`.trim()} {...props} />;
}
