import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ManualTaskForm } from "@/components/preparation/ManualTaskForm";
import { PreparationTaskActions } from "@/components/preparation/PreparationTaskActions";
import type { components } from "@/lib/api/generated/schema";

type Task = components["schemas"]["PreparationTaskResponse"];

const PENDING_TASK: Task = {
  id: "task-1",
  origin: "derived",
  task_type: "defrost",
  title: "Defrost chicken — Pollo al curry",
  instruction: "Sacar la víspera",
  due_at: "2027-06-07T08:00:00Z",
  status: "pending",
  version: 3,
  meal_plan_entry_id: "entry-1",
  planned_date: "2027-06-07",
  meal_type: "dinner",
  recipe_version_id: "rv-1",
  recipe_name: "Pollo al curry",
  ingredient_id: "ing-1",
  ingredient_name: "Pollo",
  amount: null,
  unit: null,
  completed_by_user_id: null,
  completed_at: null,
  created_at: "2027-06-01T00:00:00Z",
  updated_at: "2027-06-01T00:00:00Z",
};

const INGREDIENTS = [{ id: "ing-1", name: "Pollo", base_unit: "g" }];

describe("preparation task flows", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("sends expected_version and idempotency key on complete", async () => {
    render(<PreparationTaskActions task={PENDING_TASK} />);
    fireEvent.click(screen.getByRole("button", { name: "Completar" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/preparation-tasks/task-1/complete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "test-idempotency-key" }),
      }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body.expected_version).toBe(3);
  });

  it("sends cancel with expected_version", async () => {
    render(<PreparationTaskActions task={PENDING_TASK} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/preparation-tasks/task-1/cancel",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("hides actions on resolved tasks", () => {
    render(<PreparationTaskActions task={{ ...PENDING_TASK, status: "completed" }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    render(<PreparationTaskActions task={{ ...PENDING_TASK, status: "cancelled" }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a reload affordance on 409 conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: "La tarea cambió desde que se cargó." }),
      }),
    );
    render(<PreparationTaskActions task={PENDING_TASK} />);
    fireEvent.click(screen.getByRole("button", { name: "Completar" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Recargar tareas actualizadas" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("cambió");
  });

  it("surfaces API errors on transition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "fallo" }),
      }),
    );
    render(<PreparationTaskActions task={PENDING_TASK} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("fallo"));
  });

  it("submits a manual task with title, due_at, ingredient and amount pair", async () => {
    render(<ManualTaskForm ingredients={INGREDIENTS} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Remojar alubias" } });
    fireEvent.change(screen.getByLabelText("Vence"), {
      target: { value: "2027-06-10T21:00" },
    });
    fireEvent.change(screen.getByLabelText("Ingrediente (opcional)"), {
      target: { value: "ing-1" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad (opcional)"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Unidad (opcional)"), { target: { value: "kg" } });
    fireEvent.submit(screen.getByRole("button", { name: "Crear tarea" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/preparation-tasks",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "test-idempotency-key" }),
      }),
    );
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body.title).toBe("Remojar alubias");
    expect(body.due_at).toMatch(/^2027-06-1/);
    expect(body.ingredient_id).toBe("ing-1");
    expect(body.amount).toBe(0.5);
    expect(body.unit).toBe("kg");
  });

  it("submits a minimal manual task with nulls for optional fields", async () => {
    render(<ManualTaskForm ingredients={INGREDIENTS} />);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Picar ajo" } });
    fireEvent.change(screen.getByLabelText("Vence"), {
      target: { value: "2027-06-10T21:00" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Crear tarea" }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const body = JSON.parse(
      ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }).body,
    );
    expect(body).toMatchObject({
      title: "Picar ajo",
      instruction: null,
      ingredient_id: null,
      amount: null,
      unit: null,
    });
  });
});
