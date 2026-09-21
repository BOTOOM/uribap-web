import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { MealPlanEntryForm } from "@/components/planning/MealPlanEntryForm";
import { MealPlanTransitionBar } from "@/components/planning/MealPlanTransitionBar";

const VERSIONS = [
  {
    recipe_version_id: "11111111-1111-1111-1111-111111111111",
    recipe_id: "22222222-2222-2222-2222-222222222222",
    recipe_name: "Arroz con pollo",
    version_number: 1,
    base_servings: 4,
    prep_minutes: 40,
  },
];

describe("meal planning forms", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }),
    );
    vi.stubGlobal("crypto", { randomUUID: () => "test-idempotency-key" });
  });

  it("sends expected_version and the stable idempotency key", async () => {
    render(
      <MealPlanEntryForm
        planId="plan-1"
        weekStart="2026-09-28"
        version={3}
        versions={VERSIONS}
      />,
    );
    fireEvent.submit(screen.getByRole("button", { name: "Añadir al plan" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/plans/plan-1/entries",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "test-idempotency-key" }),
      }),
    );
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.expected_version).toBe(3);
  });

  it("offers propose/approve actions by state and shows conflict reload on 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ detail: "conflict" }) }),
    );
    render(<MealPlanTransitionBar planId="plan-1" state="proposed" version={4} />);
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/plans/plan-1/transitions/approve",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByRole("button", { name: "Recargar plan actualizado" })).toBeInTheDocument();
  });
});
