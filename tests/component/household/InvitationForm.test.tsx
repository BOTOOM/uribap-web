import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationForm } from "@/components/household/InvitationForm";

const EMAIL = "invitee@example.test";
const DELIVERY_CASES = [
  [
    "zitadel_invite",
    `Invitación creada. ${EMAIL} recibirá un correo para crear su acceso y verá la invitación al entrar a Uribap.`,
  ],
  [
    "existing_account",
    "Invitación creada. Esta persona ya tiene cuenta: verá la invitación al entrar a Uribap.",
  ],
  ["email", "Invitación enviada por correo."],
  [
    "failed",
    "La invitación quedó creada, pero no se pudo enviar el correo. Pídele que entre a Uribap con este email para aceptarla.",
  ],
] as const;

function response(delivery: string, ok = true) {
  return {
    ok,
    json: async () => (ok ? { delivery } : { detail: delivery }),
  };
}

function submitInvitation(displayName?: string) {
  render(<InvitationForm householdId="household-1" />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: EMAIL } });
  if (displayName !== undefined) {
    fireEvent.change(screen.getByLabelText("Nombre (opcional)"), {
      target: { value: displayName },
    });
  }
  fireEvent.submit(screen.getByRole("form", { name: "Invitar a una persona al hogar" }));
}

describe("InvitationForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("email")));
  });

  it.each(DELIVERY_CASES)("shows the %s delivery message", async (delivery, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(delivery)));

    submitInvitation();

    expect(await screen.findByRole("status")).toHaveTextContent(message);
  });

  it("omits display_name when the optional name is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("email"));
    vi.stubGlobal("fetch", fetchMock);

    submitInvitation("   ");

    await screen.findByRole("status");
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({ email: EMAIL, role: "member" });
  });

  it("sends a trimmed display_name when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("email"));
    vi.stubGlobal("fetch", fetchMock);

    submitInvitation("  Ada Lovelace  ");

    await screen.findByRole("status");
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({
      email: EMAIL,
      role: "member",
      display_name: "Ada Lovelace",
    });
  });

  it("shows API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("No se pudo invitar.", false)));

    submitInvitation();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo invitar.");
  });
});
