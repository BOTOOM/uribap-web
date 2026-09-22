import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "@/components/household/ActivityFeed";

const OUTBOX = { pending: 1, sent: 0, failed: 0, suppressed: 3 };

const ENTRY = {
  id: "event-1",
  kind: "plan.approved",
  occurredAt: "2027-06-07T18:30:00Z",
  aggregateType: "meal_plan",
  aggregateId: "plan-1",
  actorUserId: "user-1",
  payload: {},
};

describe("household activity accessibility", () => {
  it("names the outbox summary and marks timestamps as time elements", () => {
    render(
      <ActivityFeed
        initialFeed={{ entries: [ENTRY], page: 1, pageSize: 20, hasMore: true }}
        outbox={OUTBOX}
      />,
    );
    expect(screen.getByRole("group", { name: "Resumen de correo" })).toBeInTheDocument();
    expect(document.querySelector("time[datetime]")).not.toBeNull();
  });

  it("keeps the pagination control a focusable named button", () => {
    render(
      <ActivityFeed
        initialFeed={{ entries: [ENTRY], page: 1, pageSize: 20, hasMore: true }}
        outbox={OUTBOX}
      />,
    );
    const button = screen.getByRole("button", { name: "Cargar más" });
    expect(button).toBeEnabled();
    button.focus();
    expect(button).toHaveFocus();
  });

  it("announces the empty state through a status region", () => {
    render(
      <ActivityFeed
        initialFeed={{ entries: [], page: 1, pageSize: 20, hasMore: false }}
        outbox={OUTBOX}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Todavía no hay actividad/);
  });
});
