import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { CompleteMealButton } from "@/components/completion/CompleteMealButton";
import { CorrectLineForm } from "@/components/completion/CorrectLineForm";
import { ReopenCompletionButton } from "@/components/completion/ReopenCompletionButton";

describe("meal completion flows", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("posts a completion with an empty body for planned defaults", async () => {
    render(<CompleteMealButton planId="plan-1" entryId="entry-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Completar comida" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/plans/plan-1/entries/entry-1/complete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "test-idempotency-key" }),
      }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body).toEqual({});
  });

  it("shows a reload affordance on 409 insufficient stock or duplicate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: "Inventario insuficiente." }),
      }),
    );
    render(<CompleteMealButton planId="plan-1" entryId="entry-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Completar comida" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Inventario insuficiente");
  });

  it("submits a line correction with expected_version", async () => {
    render(
      <CorrectLineForm
        completionId="c-1"
        lineId="l-1"
        version={4}
        currentAmount="0.500000"
        unit="kg"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Corregir" }));
    fireEvent.change(screen.getByLabelText(/Cantidad real/), { target: { value: "0.7" } });
    fireEvent.submit(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/meal-completions/c-1/lines/l-1/correct",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body).toEqual({ expected_version: 4, actual_amount: "0.7", unit: "kg" });
  });

  it("posts a reopen with expected_version", async () => {
    render(<ReopenCompletionButton completionId="c-1" version={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Reabrir" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/meal-completions/c-1/reopen",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body.expected_version).toBe(2);
  });

  it("surfaces API errors on reopen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "fallo" }),
      }),
    );
    render(<ReopenCompletionButton completionId="c-1" version={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Reabrir" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("fallo"));
  });
});
