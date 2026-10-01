import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import type { components } from "@/lib/api/generated/schema";
import { MemoryCard } from "@/components/memory/MemoryCard";

type Memory = components["schemas"]["MemoryResponse"];

function memory(overrides: Partial<Memory> = {}): Memory {
  return {
    archived_at: null,
    content: "Compra fruta",
    created_at: "2026-10-01T12:00:00Z",
    created_by_user_id: null,
    diner_id: null,
    id: "memory-1",
    kind: "note",
    updated_at: "2026-10-01T12:00:00Z",
    version: 7,
    ...overrides,
  };
}

const fetchMock = vi.fn();

function renderCard(memories: Memory[] = []) {
  return render(<MemoryCard title="Todo el hogar" memories={memories} dinerId={null} />);
}

function fillNewMemory(content: string, kind = "note") {
  fireEvent.change(screen.getByLabelText("Tipo de recuerdo nuevo"), {
    target: { value: kind },
  });
  fireEvent.change(screen.getByLabelText("Recuerdo nuevo"), { target: { value: content } });
}

function submitNewMemory() {
  fireEvent.click(screen.getByRole("button", { name: "Agregar recuerdo" }));
}

function editMemory(content: string) {
  fireEvent.click(screen.getByRole("button", { name: /Editar recuerdo:/ }));
  fireEvent.change(screen.getByLabelText("Contenido del recuerdo"), {
    target: { value: content },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
}

describe("MemoryCard", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("memory-key-1"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends a fresh idempotency key for each add-memory POST", async () => {
    const randomUUID = vi.fn().mockReturnValueOnce("memory-key-1").mockReturnValueOnce("memory-key-2");
    vi.stubGlobal("crypto", { randomUUID });
    renderCard();

    fillNewMemory("Comemos para dos", "like");
    submitNewMemory();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fillNewMemory("El agua es del filtro", "note");
    submitNewMemory();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/memories",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "memory-key-1" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/memories",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "memory-key-2" }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      content: "Comemos para dos",
      kind: "like",
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      content: "El agua es del filtro",
      kind: "note",
    });
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(2);
  });

  it("limits new memory content to 1000 characters and shows a live counter", () => {
    renderCard();
    const content = screen.getByLabelText("Recuerdo nuevo");

    expect(content).toHaveAttribute("maxLength", "1000");
    fireEvent.change(content, { target: { value: "cinco" } });
    expect(screen.getByText("5/1000 caracteres")).toBeInTheDocument();
  });

  it("updates memory content and kind with the current expected version", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    renderCard([memory()]);

    fireEvent.click(screen.getByRole("button", { name: /Editar recuerdo:/ }));
    const editForm = screen.getByRole("form", { name: "Editar recuerdo" });
    fireEvent.change(within(editForm).getByLabelText("Contenido del recuerdo"), {
      target: { value: "Compra verduras" },
    });
    fireEvent.change(within(editForm).getByLabelText("Tipo de recuerdo"), {
      target: { value: "like" },
    });
    fireEvent.click(within(editForm).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/memories/memory-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      content: "Compra verduras",
      expected_version: 7,
      kind: "like",
    });
  });

  it("requires confirmation before forgetting a memory", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderCard([memory()]);

    fireEvent.click(screen.getByRole("button", { name: /Olvidar recuerdo:/ }));
    expect(confirm).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Olvidar recuerdo:/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/memories/memory-1",
      expect.objectContaining({ method: "DELETE" }),
    ));
  });

  it("announces conflict feedback and refreshes stale data", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ detail: "Este recuerdo cambió en otro lugar." }),
    });
    renderCard([memory()]);

    editMemory("Compra verduras");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Este recuerdo cambió en otro lugar."),
    );
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });

  it("announces a gone-record response instead of showing a successful save", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Este recuerdo ya no está disponible." }),
    });
    renderCard([memory()]);

    editMemory("Compra verduras");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Este recuerdo ya no está disponible."),
    );
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });

  it.each([
    [403, "No tienes permiso para editar este recuerdo."],
    [422, "El recuerdo debe tener entre 1 y 1000 caracteres."],
  ])("announces API validation or permission status %s", async (status, detail) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ detail }),
    });
    renderCard();

    fillNewMemory("Texto de prueba");
    submitNewMemory();

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(detail));
  });

  it("disables the submit control while the request is pending", async () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    renderCard();

    fillNewMemory("Texto de prueba");
    submitNewMemory();

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });
});
