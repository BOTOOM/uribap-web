import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { PermissionState, StaleState, UnavailableState } from "@/components/states/RequestStates";

export function StateExamples() {
  return (
    <div className="state-examples">
      <LoadingState />
      <EmptyState title="Todavía no hay comidas" description="Añade una receta para empezar a ver consecuencias." />
      <ErrorState title="No pudimos actualizar" description="El hogar sigue intacto. Inténtalo de nuevo." />
      <PermissionState />
      <PermissionState forbidden />
      <StaleState />
      <UnavailableState />
    </div>
  );
}
