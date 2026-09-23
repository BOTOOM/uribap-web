import type { HTMLAttributes } from "react";

type StatusTone = "ready" | "muted" | "warning" | "missing" | "frozen";

const TONE_CLASSES: Record<StatusTone, string> = {
  ready: "available",
  muted: "pending",
  warning: "low",
  missing: "missing",
  frozen: "frozen",
};

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
};

export function StatusBadge({ tone = "muted", className = "", ...props }: StatusBadgeProps) {
  return <span className={`status ${TONE_CLASSES[tone]} ${className}`.trim()} {...props} />;
}
