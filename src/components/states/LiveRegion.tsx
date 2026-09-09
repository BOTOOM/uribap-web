import type { ReactNode } from "react";

export function LiveRegion({ children }: { children: ReactNode }) {
  return <div className="sr-only" aria-live="polite" aria-atomic="true">{children}</div>;
}
