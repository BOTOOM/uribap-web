import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import type { components } from "@/lib/api/generated/schema";
import { MemoryProfile } from "@/components/memory/MemoryProfile";

type Profile = components["schemas"]["HouseholdMemoryProfile"];

const profile: Profile = {
  household: [
    {
      archived_at: null,
      content: "Comemos para dos",
      created_at: "2026-10-01T12:00:00Z",
      created_by_user_id: null,
      diner_id: null,
      id: "memory-household",
      kind: "note",
      updated_at: "2026-10-01T12:00:00Z",
      version: 1,
    },
  ],
  diners: [
    {
      diner: {
        archived_at: null,
        created_at: "2026-10-01T12:00:00Z",
        display_name: "Pareja",
        id: "diner-1",
        member_user_id: null,
        updated_at: "2026-10-01T12:00:00Z",
        version: 2,
      },
      memories: [
        {
          archived_at: null,
          content: "Sin nueces",
          created_at: "2026-10-01T12:00:00Z",
          created_by_user_id: null,
          diner_id: "diner-1",
          id: "memory-restriction",
          kind: "restriction",
          updated_at: "2026-10-01T12:00:00Z",
          version: 1,
        },
      ],
    },
  ],
};

describe("memory settings accessibility", () => {
  it("exposes clear headings, labeled forms, restriction text, and keyboard-focusable controls", () => {
    render(<MemoryProfile profile={profile} members={[]} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Memoria del hogar" }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Recuerdo nuevo")).toHaveLength(2);
    expect(screen.getAllByLabelText("Tipo de recuerdo nuevo")).toHaveLength(2);
    expect(screen.getByLabelText("Nombre de la persona")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Restricción" })).toBeInTheDocument();
    expect(screen.getByText("Sin nueces")).toBeInTheDocument();

    const name = screen.getByLabelText("Nombre de la persona");
    name.focus();
    expect(name).toHaveFocus();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });
});
