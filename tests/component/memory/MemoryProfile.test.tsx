import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import type { components } from "@/lib/api/generated/schema";
import { MemoryProfile } from "@/components/memory/MemoryProfile";

type Memory = components["schemas"]["MemoryResponse"];
type Profile = components["schemas"]["HouseholdMemoryProfile"];
type Member = components["schemas"]["MemberResponse"];
const fetchMock = vi.fn();

function memory(
  id: string,
  kind: Memory["kind"],
  content: string,
  dinerId: string | null = null,
): Memory {
  return {
    archived_at: null,
    content,
    created_at: "2026-10-01T12:00:00Z",
    created_by_user_id: null,
    diner_id: dinerId,
    id,
    kind,
    updated_at: "2026-10-01T12:00:00Z",
    version: 1,
  };
}

function member(id: string, userId: string, displayName: string): Member {
  return {
    display_name: displayName,
    email: `${id}@example.test`,
    email_verified: true,
    id,
    joined_at: "2026-10-01T12:00:00Z",
    role: "member",
    status: "active",
    user_id: userId,
    version: 1,
  };
}

const linkedMember = member("member-edwar", "user-edwar", "Edwar");
const availableMember = member("member-maria", "user-maria", "María");
const profile: Profile = {
  household: [
    memory(
      "memory-household",
      "note",
      "Comemos para dos; el agua es del filtro, no se compra",
    ),
  ],
  diners: [
    {
      diner: {
        archived_at: null,
        created_at: "2026-10-01T12:00:00Z",
        display_name: "Pareja",
        id: "diner-pareja",
        member_user_id: "user-edwar",
        updated_at: "2026-10-01T12:00:00Z",
        version: 1,
      },
      memories: [
        memory("memory-restriction", "restriction", "Sin nueces", "diner-pareja"),
        memory("memory-like", "like", "Le gusta el arroz", "diner-pareja"),
      ],
    },
  ],
};

describe("MemoryProfile", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the heading, exact introduction, household memory, and linked diner", () => {
    render(<MemoryProfile profile={profile} members={[linkedMember, availableMember]} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Memoria del hogar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Lo que Uribap y tus agentes recuerdan para sugerir comidas."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Comemos para dos; el agua es del filtro, no se compra"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pareja")).toBeInTheDocument();
    expect(screen.getByText("Cuenta vinculada: Edwar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Restricción" })).toBeInTheDocument();
    expect(screen.getByText("Sin nueces")).toBeInTheDocument();
  });

  it("offers only active household members not already linked to a diner", () => {
    render(<MemoryProfile profile={profile} members={[linkedMember, availableMember]} />);

    expect(screen.getByRole("option", { name: "María" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Edwar" })).not.toBeInTheDocument();
  });

  it("explains the empty state while keeping household memory and add-person forms available", () => {
    render(<MemoryProfile profile={{ household: [], diners: [] }} members={[]} />);

    expect(screen.getByText(/Todavía no hay personas ni recuerdos/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Recuerdo nuevo")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la persona")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar recuerdo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar persona" })).toBeInTheDocument();
  });

  it("keeps the archive confirmation in the profile status after refresh", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = render(<MemoryProfile profile={profile} members={[linkedMember, availableMember]} />);

    fireEvent.click(screen.getByRole("button", { name: "Archivar persona" }));
    await waitFor(() => expect(screen.getByText("Persona archivada.")).toBeInTheDocument());

    const archiveStatus = screen.getByRole("status");
    expect(archiveStatus).not.toHaveClass("sr-only");
    expect(archiveStatus).toBeVisible();
    expect(archiveStatus).toHaveTextContent("Persona archivada.");

    view.rerender(
      <MemoryProfile
        members={[linkedMember, availableMember]}
        profile={{ ...profile, diners: [] }}
      />,
    );
    expect(screen.getByText("Persona archivada.")).toBeVisible();
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });
});
