import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const SECOND_ENTRY = {
  id: "event-2",
  kind: "meal.completed",
  occurredAt: "2027-06-06T19:00:00Z",
  aggregateType: "meal_completion",
  aggregateId: "completion-1",
  actorUserId: "user-2",
  payload: {},
};

describe("household activity feed", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders localized kind labels, timestamps, and the outbox summary", () => {
    render(
      <ActivityFeed
        initialFeed={{ entries: [ENTRY], page: 1, pageSize: 20, hasMore: false }}
        outbox={OUTBOX}
      />,
    );
    expect(screen.getByText("Plan aprobado")).toBeInTheDocument();
    expect(screen.getByText("Suprimido")).toBeInTheDocument();
    expect(screen.getByText(/envío de email está deshabilitado/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  it("renders unknown kinds as a muted raw label for forward compatibility", () => {
    render(
      <ActivityFeed
        initialFeed={{
          entries: [{ ...ENTRY, id: "event-x", kind: "future.kind" }],
          page: 1,
          pageSize: 20,
          hasMore: false,
        }}
        outbox={OUTBOX}
      />,
    );
    expect(screen.getByText("future.kind")).toBeInTheDocument();
  });

  it("shows the empty state when there are no entries", () => {
    render(
      <ActivityFeed
        initialFeed={{ entries: [], page: 1, pageSize: 20, hasMore: false }}
        outbox={OUTBOX}
      />,
    );
    expect(screen.getByText(/Todavía no hay actividad/)).toBeInTheDocument();
  });

  it("appends the next page and hides the control at the end", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ entries: [SECOND_ENTRY], page: 2, pageSize: 20, hasMore: false }),
    });
    render(
      <ActivityFeed
        initialFeed={{ entries: [ENTRY], page: 1, pageSize: 20, hasMore: true }}
        outbox={OUTBOX}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    expect(fetch).toHaveBeenCalledWith("/api/households/activity?page=2&page_size=20");
    await waitFor(() => expect(screen.getByText("Comida completada")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  it("surfaces a load error without dropping existing entries", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ code: "internal_error", detail: "Fallo de prueba." }),
    });
    render(
      <ActivityFeed
        initialFeed={{ entries: [ENTRY], page: 1, pageSize: 20, hasMore: true }}
        outbox={OUTBOX}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Fallo de prueba."));
    expect(screen.getByText("Plan aprobado")).toBeInTheDocument();
  });
});
