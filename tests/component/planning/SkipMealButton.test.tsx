import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/toast", () => ({ toast: vi.fn() }));

import { SkipMealButton } from "@/components/planning/SkipMealButton";
import { toast } from "@/lib/toast";

describe("SkipMealButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "skip-key-1" });
  });

  it("posts an optional reason with an idempotency key and refreshes after success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "completion-1" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<SkipMealButton entryId="entry-1" planId="plan-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Pedimos domicilio" }));
    const reason = screen.getByLabelText("¿Qué pasó? (opcional)");
    expect(reason).toHaveAttribute("maxLength", "2000");
    fireEvent.change(reason, { target: { value: "No alcanzamos a cocinar" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plans/plan-1/entries/entry-1/skip",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "skip-key-1",
        }),
        body: JSON.stringify({ reason: "No alcanzamos a cocinar" }),
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      "Comida marcada como no cocinada — inventario sin cambios",
    );
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("generates a fresh idempotency key after a successful request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "completion-1" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("skip-key-1").mockReturnValueOnce("skip-key-2"),
    });
    render(<SkipMealButton entryId="entry-1" planId="plan-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Pedimos domicilio" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Pedimos domicilio" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(
      fetchMock.mock.calls.map(([, init]) => {
        const headers = init?.headers as Record<string, string> | undefined;
        return headers?.["Idempotency-Key"];
      }),
    ).toEqual(["skip-key-1", "skip-key-2"]);
  });

  it("shows a conflict message and a reload affordance on 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "La comida ya cambió." }, { status: 409 }),
      ),
    );
    render(<SkipMealButton entryId="entry-1" planId="plan-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Pedimos domicilio" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La comida ya cambió.");
    fireEvent.click(screen.getByRole("button", { name: "Recargar" }));
    expect(router.refresh).toHaveBeenCalledOnce();
  });
});
