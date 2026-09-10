"use client";

import { useState } from "react";

type Member = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  status: string;
  version?: number;
};

export function MemberManagement({ householdId, initialMembers, canManage }: {
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
      const result = (await response.json().catch(() => null)) as Member & { detail?: string };
      if (!response.ok) throw new Error(result.detail ?? "No se pudo cambiar el rol.");
      setMembers((current) => current.map((member) => member.user_id === userId ? { ...member, ...result } : member));
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
      const result = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) throw new Error(result?.detail ?? "No se pudo revocar el acceso.");
      setMembers((current) => current.map((member) => member.user_id === userId ? { ...member, status: "revoked" } : member));
      setMessage("Acceso revocado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo revocar el acceso.");
    } finally {
      setPendingUser(null);
    }
  }

  return (
    <div>
      <ul>
        {members.map((member) => (
          <li key={member.user_id}>
            <span className="item-index">{member.role.slice(0, 2).toUpperCase()}</span>
            <span>{member.display_name ?? member.email ?? "Persona"} · {member.role} · {member.status}</span>
            {canManage && member.role !== "owner" && member.status === "active" ? (
              <span className="foundation-actions">
                <select
                  aria-label={`Rol de ${member.display_name ?? member.email ?? "persona"}`}
                  value={member.role}
                  disabled={pendingUser === member.user_id}
                  onChange={(event) => void updateMember(member.user_id, event.target.value, member.version)}
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="status status-warning"
                  type="button"
                  disabled={pendingUser === member.user_id}
                  onClick={() => void revokeMember(member.user_id, member.version)}
                >
                  Revocar
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
