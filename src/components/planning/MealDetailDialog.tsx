"use client";

import type { JSX } from "react";
import { useEffect, useRef } from "react";

import { MealEntryDetail } from "@/components/planning/MealEntryDetail";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { components } from "@/lib/api/generated/schema";

type MealPlanState = components["schemas"]["MealPlanState"];

export type MealDetailTarget = {
  id: string;
  outcome: "cooked" | "skipped" | null;
  completionVersion: number | null;
};

export function MealDetailDialog({
  planId,
  planState,
  version,
  target,
  onClose,
  fallbackFocus,
}: {
  planId: string;
  planState: MealPlanState;
  version: number;
  target: MealDetailTarget | null;
  onClose: () => void;
  fallbackFocus?: () => HTMLElement | null;
}): JSX.Element {
  const lastTargetId = useRef<string | null>(null);
  const targetId = target?.id ?? null;

  useEffect(() => {
    if (targetId !== null) lastTargetId.current = targetId;
  }, [targetId]);

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="meal-detail-dialog"
        onCloseAutoFocus={(event) => {
          const id = lastTargetId.current;
          const trigger = id
            ? document.querySelector<HTMLElement>(
                `[data-meal-entry-trigger="${CSS.escape(id)}"]`,
              )
            : null;
          const focusTarget = trigger ?? fallbackFocus?.() ?? null;
          if (focusTarget === null) return;
          event.preventDefault();
          focusTarget.focus();
        }}
      >
        <div className="dialog-head">
          <DialogTitle className="sr-only">Detalle de la comida</DialogTitle>
          <DialogClose aria-label="Cerrar" className="icon-btn">
            <Icon name="close" size={16} />
          </DialogClose>
        </div>
        {target ? (
          <div className="dialog-body">
            <MealEntryDetail
              entryId={target.id}
              planId={planId}
              planState={planState}
              refreshKey={`${target.id}:${target.outcome ?? "pending"}:${target.completionVersion ?? "none"}`}
              version={version}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
