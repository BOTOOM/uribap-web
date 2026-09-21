import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ManualTaskForm } from "@/components/preparation/ManualTaskForm";
import { PreparationTaskActions } from "@/components/preparation/PreparationTaskActions";
import type { components } from "@/lib/api/generated/schema";

const TASK: components["schemas"]["PreparationTaskResponse"] = {
  id: "task-1",
  origin: "manual",
  task_type: "manual",
  title: "Remojar alubias",
  instruction: null,
  due_at: "2027-06-07T08:00:00Z",
  status: "pending",
  version: 1,
  meal_plan_entry_id: null,
  planned_date: null,
  meal_type: null,
  recipe_version_id: null,
  recipe_name: null,
  ingredient_id: null,
  ingredient_name: null,
  amount: null,
  unit: null,
  completed_by_user_id: null,
  completed_at: null,
  created_at: "2027-06-01T00:00:00Z",
  updated_at: "2027-06-01T00:00:00Z",
};

describe("preparation accessibility", () => {
  it("keeps the manual form controls associated with visible labels", () => {
    render(<ManualTaskForm ingredients={[{ id: "i1", name: "Alubias", base_unit: "g" }]} />);
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Vence")).toBeInTheDocument();
    expect(screen.getByLabelText("Instrucción (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Ingrediente (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Unidad (opcional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear tarea" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Crear tarea manual" })).toBeInTheDocument();
  });

  it("exposes pending-task actions as labelled buttons", () => {
    render(<PreparationTaskActions task={TASK} />);
    expect(screen.getByRole("button", { name: "Completar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("renders no controls for resolved tasks", () => {
    render(<PreparationTaskActions task={{ ...TASK, status: "completed" }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
