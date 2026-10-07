"use client";

import type { JSX } from "react";

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
}: {
  planId: string;
  planState: MealPlanState;
  version: number;
  target: MealDetailTarget | null;
  onClose: () => void;
}): JSX.Element {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="meal-detail-dialog">
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
