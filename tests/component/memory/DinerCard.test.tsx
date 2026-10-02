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

  it("marks an invalid member link on the account selector and refreshes", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        code: "invalid_member_link",
        detail: "The linked user must be an active member of this household.",
      }),
    });
    render(<AddDinerForm members={[member()]} />);

    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Pareja" },
    });
    fireEvent.change(screen.getByLabelText("Cuenta del hogar (opcional)"), {
      target: { value: "user-edwar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Cuenta del hogar (opcional)")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByLabelText("Nombre de la persona")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });

  it("maps duplicate display-name conflicts to the name field", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        code: "conflict",
        detail: "An active diner with this name already exists in the household.",
      }),
    });
    render(<AddDinerForm members={[member()]} />);

    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Nombre de la persona")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByLabelText("Cuenta del hogar (opcional)")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("maps display-name validation details and leaves unrelated 422 errors global-only", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        code: "validation_error",
        detail: [{ loc: ["body", "display_name"], msg: "Display name is invalid." }],
      }),
    });
    render(<AddDinerForm members={[member()]} />);

    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Nombre de la persona")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        code: "validation_error",
        detail: "The request contains invalid fields.",
      }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "The request contains invalid fields.",
      ),
    );
    expect(screen.getByLabelText("Nombre de la persona")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
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
    const onArchiveStart = vi.fn();
    const onArchived = vi.fn();
    render(
      <DinerCard
        onArchiveStart={onArchiveStart}
        onArchived={onArchived}
        profile={profile()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archivar persona" }));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringMatching(/los recuerdos dejarán de usarse/i),
    );
    expect(onArchiveStart).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Archivar persona" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/diners/diner-1",
      expect.objectContaining({ method: "DELETE" }),
    ));
    expect(onArchiveStart).toHaveBeenCalledTimes(1);
    expect(onArchived).toHaveBeenCalledWith("Pareja");
  });

  it.each([
    [403, "No tienes permiso para editar esta persona.", {}],
    [404, "Esta persona ya no está disponible.", {}],
    [409, "Esta persona cambió en otro lugar.", {}],
    [422, "Display name is invalid.", { code: "display_name_invalid" }],
  ])("announces diner update status %s", async (status, detail, metadata) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ ...metadata, detail }),
    });
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar nombre de Pareja" }));
    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Mi pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(detail));
  });

  it("marks duplicate display-name conflicts on the rename field", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        code: "conflict",
        detail: "An active diner with this name already exists in the household.",
      }),
    });
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar nombre de Pareja" }));
    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Mi pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Nombre de la persona")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/already exists/i);
  });

  it("keeps unrelated validation errors in the global status", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        code: "validation_error",
        detail: "The request contains invalid fields.",
      }),
    });
    render(<DinerCard profile={profile()} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar nombre de Pareja" }));
    fireEvent.change(screen.getByLabelText("Nombre de la persona"), {
      target: { value: "Mi pareja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "The request contains invalid fields.",
      ),
    );
    expect(screen.getByLabelText("Nombre de la persona")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
