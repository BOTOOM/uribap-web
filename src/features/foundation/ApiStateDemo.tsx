"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { PermissionState } from "@/components/states/RequestStates";
import { UnavailableState } from "@/components/states/RequestStates";
import { apiClient } from "@/lib/api/client";

type ApiState = "loading" | "success" | "error" | "permission" | "unavailable";

export function ApiStateDemo() {
  const [state, setState] = useState<ApiState>("loading");

  useEffect(() => {
    let active = true;

    void apiClient.GET("/api/v1/health/live").then(({ response }) => {
      if (!active) return;
      if (response.status === 401 || response.status === 403) {
        setState("permission");
      } else if (!response.ok) {
        setState("error");
      } else {
        setState("success");
      }
    }).catch(() => {
      if (active) setState("unavailable");
    });

    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return <LoadingState label="Consultando el servicio…" />;
  if (state === "permission") return <PermissionState />;
  if (state === "error") return <ErrorState title="La API rechazó la solicitud" description="El servicio respondió con un error recuperable." />;
  if (state === "unavailable") return <UnavailableState />;

  return (
    <section className="ui-state" role="status" aria-labelledby="api-state-success-title">
      <h2 id="api-state-success-title">API disponible</h2>
      <p>La frontera de datos responde sin exponer información privada.</p>
    </section>
  );
}
