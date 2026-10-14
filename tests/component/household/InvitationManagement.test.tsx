import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationManagement } from "@/components/household/InvitationManagement";

const BASE = {
  household_id: "household-1",
  requested_role: "member" as const,
  status: "pending",
  expires_at: "2027-06-07T18:30:00Z",
  invited_by_user_id: "user-1",
  created_at: "2027-05-01T10:00:00Z",
};

const PENDING = {
  ...BASE,
  id: "invitation-pending",
  email: "pendiente@ejemplo.local",
  effective_status: "pending" as const,
  delivery: "sent" as const,
};

const EXPIRED = {
  ...BASE,
  id: "invitation-expired",
  email: "vencida@ejemplo.local",
  effective_status: "expired" as const,
  delivery: "sent" as const,
};

const FAILED = {
  ...BASE,
  id: "invitation-failed",
  email: "fallida@ejemplo.local",
  effective_status: "pending" as const,
  delivery: "failed" as const,
};

const EXISTING_ACCOUNT = {
  ...BASE,
  id: "invitation-existing",
  email: "cuenta@ejemplo.local",
  effective_status: "expired" as const,
  delivery: "existing_account" as const,
};

const ACCEPTED = {
  ...BASE,
  id: "invitation-accepted",
  email: "aceptada@ejemplo.local",
  effective_status: "accepted" as const,
  delivery: "sent" as const,
};

const REVOKED = {
  ...BASE,
  id: "invitation-revoked",
  email: "revocada@ejemplo.local",
  effective_status: "revoked" as const,
  delivery: null,
};

describe("InvitationManagement", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [] }) }),
    );
  });

  it("renders email, role, status badge, delivery, and expiry for each invitation", () => {
    render(
      <InvitationManagement
        householdId="household-1"
        initialInvitations={[PENDING, EXPIRED, ACCEPTED, REVOKED]}
      />,
    );

    expect(screen.getByText("pendiente@ejemplo.local")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("vencida")).toBeInTheDocument();
    expect(screen.getByText("aceptada")).toBeInTheDocument();
    expect(screen.getByText("revocada")).toBeInTheDocument();
    expect(screen.getAllByText(/entrega: enviada/).length).toBeGreaterThan(0);
    expect(screen.getByText(/entrega: sin enviar/)).toBeInTheDocument();
    const expiry = screen.getAllByText(/vence el/)[0].querySelector("time");
    expect(expiry).toHaveAttribute("dateTime", PENDING.expires_at);
  });

  it("offers resend only on expired or failed-delivery rows and revoke only on pending rows", () => {
    render(
      <InvitationManagement
        householdId="household-1"
        initialInvitations={[PENDING, EXPIRED, FAILED, ACCEPTED, REVOKED]}
      />,
    );

    const resendButtons = screen.getAllByRole("button", { name: /Reenviar/ });
    // offered on the expired row and the failed-delivery row only
    expect(resendButtons).toHaveLength(2);

    const revokeButtons = screen.getAllByRole("button", { name: "Revocar" });
    // offered on the pending (sent) and pending (failed) rows only
    expect(revokeButtons).toHaveLength(2);
    expect(
      screen.getAllByText(/@ejemplo\.local/).map((node) => node.closest(".settings-row")),
    ).toHaveLength(5);
  });

  it("labels resend for an existing account as in-app delivery", () => {
    render(
      <InvitationManagement householdId="household-1" initialInvitations={[EXISTING_ACCOUNT]} />,
    );

    expect(screen.getByRole("button", { name: "Reenviar en la app" })).toBeInTheDocument();
  });

  it("resends with the invitation email and refetches the list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ delivery: "sent" }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ ...EXPIRED, effective_status: "pending" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<InvitationManagement householdId="household-1" initialInvitations={[EXPIRED]} />);

    fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/households/household-1/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "vencida@ejemplo.local" }),
      }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/households/household-1/invitations"),
    );
    expect(await screen.findByText("Invitación reenviada.")).toBeInTheDocument();
  });

  it("revokes a pending invitation and refetches the list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ ...PENDING, effective_status: "revoked" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<InvitationManagement householdId="household-1" initialInvitations={[PENDING]} />);

    fireEvent.click(screen.getByRole("button", { name: "Revocar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/api/households/household-1/invitations/invitation-pending",
        { method: "DELETE" },
      ),
    );
    expect(await screen.findByText("Invitación revocada.")).toBeInTheDocument();
  });

  it("surfaces a resend failure and keeps the rendered list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: "Ya existe una invitación pendiente para este email." }),
      }),
    );
    render(<InvitationManagement householdId="household-1" initialInvitations={[EXPIRED]} />);

    fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe una invitación pendiente para este email.",
    );
    expect(screen.getByText("vencida@ejemplo.local")).toBeInTheDocument();
  });

  it("shows the empty state when there are no invitations", () => {
    render(<InvitationManagement householdId="household-1" initialInvitations={[]} />);

    expect(screen.getByText("Todavía no hay invitaciones enviadas.")).toBeInTheDocument();
  });

  it("shows the error state when the listing could not load", () => {
    render(<InvitationManagement householdId="household-1" initialInvitations={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las invitaciones.",
    );
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
