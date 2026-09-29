import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { PendingInvitations } from "@/components/household/PendingInvitations";

const INVITATION = {
  id: "invitation-1",
  household_id: "household-1",
  household_name: "Casa compartida",
  requested_role: "member" as const,
  expires_at: "2027-06-07T18:30:00Z",
  invited_by_display_name: "Ana",
};

describe("PendingInvitations", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }),
    );
  });

  it("renders the household, Spanish role, and expiry", () => {
    render(<PendingInvitations items={[INVITATION]} />);

    expect(screen.getByText("Te invitaron a Casa compartida")).toBeInTheDocument();
    expect(screen.getByText("Rol: miembro")).toBeInTheDocument();
    expect(screen.getByText(/Expira el/)).toBeInTheDocument();
  });

  it("accepts by ID and navigates to the plan", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PendingInvitations items={[INVITATION]} />);

    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/me/invitations/invitation-1/accept",
        { method: "POST" },
      ),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/plan"));
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("shows an acceptance error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: "La invitación ya fue aceptada." }),
      }),
    );
    render(<PendingInvitations items={[INVITATION]} />);

    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La invitación ya fue aceptada.",
    );
  });
});
