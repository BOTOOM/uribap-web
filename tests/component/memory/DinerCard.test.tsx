import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import type { components } from "@/lib/api/generated/schema";
import { AddDinerForm } from "@/components/memory/AddDinerForm";
import { DinerCard } from "@/components/memory/DinerCard";

type Member = components["schemas"]["MemberResponse"];
type DinerProfile = components["schemas"]["DinerMemoryProfile"];

const fetchMock = vi.fn();

function member(): Member {
  return {
    display_name: "Edwar",
    email: "edwar@example.test",
    email_verified: true,
    id: "membership-1",
    joined_at: "2026-10-01T12:00:00Z",
    role: "member",
    status: "active",
    user_id: "user-edwar",
    version: 1,
  };
}

function profile(): DinerProfile {
  return {
    diner: {
      archived_at: null,
      created_at: "2026-10-01T12:00:00Z",
      display_name: "Pareja",
      id: "diner-1",
      member_user_id: null,
      updated_at: "2026-10-01T12:00:00Z",
      version: 4,
    },
    memories: [],
  };
}

describe("AddDinerForm", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "diner-key-1" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requires a 1–80 character name and optionally links an active member", async () => {
    render(<AddDinerForm members={[member()]} />);

    const name = screen.getByLabelText("Nombre de la persona");
    expect(name).toHaveAttribute("required");
    expect(name).toHaveAttribute("minLength", "1");
    expect(name).toHaveAttribute("maxLength", "80");

    fireEvent.change(name, { target: { value: "Pareja" } });
    fireEvent.change(screen.getByLabelText("Cuenta del hogar (opcional)"), {
      target: { value: "user-edwar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/diners",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "diner-key-1" }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      display_name: "Pareja",
      member_user_id: "user-edwar",
    });
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });
});

describe("DinerCard", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "unused-key" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renames a diner using its expected version", async () => {
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar nombre de Pareja" }));
    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Mi pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/diners/diner-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      display_name: "Mi pareja",
      expected_version: 4,
    });
  });

  it("confirms that archived diner memories will stop being used", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Archivar persona" }));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringMatching(/los recuerdos dejarán de usarse/i),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Archivar persona" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/diners/diner-1",
      expect.objectContaining({ method: "DELETE" }),
    ));
  });

  it.each([
    [403, "No tienes permiso para editar esta persona."],
    [404, "Esta persona ya no está disponible."],
    [409, "Esta persona cambió en otro lugar."],
    [422, "El nombre debe tener entre 1 y 80 caracteres."],
  ])("announces diner update status %s", async (status, detail) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ detail }),
    });
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar nombre de Pareja" }));
    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Mi pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(detail));
  });
});
