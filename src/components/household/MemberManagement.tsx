"use client";

import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  owner: "propietario",
  admin: "admin",
  member: "miembro",
};

type Member = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  status: string;
  version?: number;
};

function initial(name: string | null, email: string | null): string {
  return (name ?? email ?? "?").trim().charAt(0).toUpperCase();
}

export function MemberManagement({
  householdId,
  initialMembers,
  canManage,
}: {
  householdId: string;
  initialMembers: Member[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);

  async function updateMember(userId: string, role: string, version?: number) {
    setPendingUser(userId);
    setMessage(null);
    try {
      const response = await fetch(`/api/households/${householdId}/members/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(version ? { "If-Match": String(version) } : {}),
        },
        body: JSON.stringify({ role }),
      });
      const result = (await response.json().catch(() => null)) as Member & {
        detail?: string;
      };
      if (!response.ok) throw new Error(result.detail ?? "No se pudo cambiar el rol.");
      setMembers((current) =>
        current.map((member) =>
          member.user_id === userId ? { ...member, ...result } : member,
        ),
      );
      setMessage("Rol actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cambiar el rol.");
    } finally {
      setPendingUser(null);
    }
  }

  async function revokeMember(userId: string, version?: number) {
    setPendingUser(userId);
    setMessage(null);
    try {
      const response = await fetch(`/api/households/${householdId}/members/${userId}`, {
        method: "DELETE",
        headers: version ? { "If-Match": String(version) } : undefined,
      });
      const result = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;
      if (!response.ok) throw new Error(result?.detail ?? "No se pudo revocar el acceso.");
      setMembers((current) =>
        current.map((member) =>
          member.user_id === userId ? { ...member, status: "revoked" } : member,
        ),
      );
      setMessage("Acceso revocado.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo revocar el acceso.",
      );
    } finally {
      setPendingUser(null);
    }
  }

  return (
    <div>
      {members.map((member) => (
        <div className="settings-row" key={member.user_id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span aria-hidden="true" className="avatar">
              {initial(member.display_name, member.email)}
            </span>
            <div style={{ minWidth: 0 }}>
              <span className="meal-name">
                {member.display_name ?? member.email ?? "Persona"}
              </span>
              <span className="meta" style={{ display: "block" }}>
                {ROLE_LABELS[member.role] ?? member.role}
                {member.status !== "active" ? ` · ${member.status}` : ""}
              </span>
            </div>
          </div>
          {canManage && member.role !== "owner" && member.status === "active" ? (
            <span className="planner-actions" style={{ marginLeft: 0 }}>
              <select
                aria-label={`Rol de ${member.display_name ?? member.email ?? "persona"}`}
                className="select"
                disabled={pendingUser === member.user_id}
                style={{ minHeight: 40, width: "auto" }}
                value={member.role}
                onChange={(event) =>
                  void updateMember(member.user_id, event.target.value, member.version)
                }
              >
                <option value="member">Miembro</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="btn btn-ghost"
                disabled={pendingUser === member.user_id}
                onClick={() => void revokeMember(member.user_id, member.version)}
                type="button"
              >
                Revocar
              </button>
            </span>
          ) : null}
        </div>
      ))}
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
