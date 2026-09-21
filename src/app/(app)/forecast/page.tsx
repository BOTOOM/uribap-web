import Link from "next/link";
import type { Route } from "next";

import { DemandTable } from "@/components/forecast/DemandTable";
import { ErrorState } from "@/components/states/ErrorState";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { shiftWeek, weekWindow } from "@/lib/forecast/window";

type DemandForecast = components["schemas"]["DemandForecastResponse"];

async function loadForecast(fromDate: string, toDate: string) {
  try {
    return await serverHouseholdFetch<DemandForecast>(
      `/forecast/demand?from_date=${fromDate}&to_date=${toDate}`,
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return { forbidden: true as const };
    }
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const { fromDate, toDate } = weekWindow(week);
  const forecast = await loadForecast(fromDate, toDate);

  if ("forbidden" in forecast) {
    return (
      <ErrorState
        title="Sin acceso al hogar"
        description="Necesitas una membresía activa para ver la previsión de demanda."
        actionHref={"/settings/household" as Route}
        actionLabel="Ir al hogar"
      />
    );
  }
  if ("error" in forecast) {
    return <ErrorState title="No se pudo cargar la previsión" description={forecast.error} />;
  }

  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="forecast-title">
        <p className="eyebrow">Uribap · previsión</p>
        <h1 id="forecast-title">
          Demanda del {forecast.from_date} al {forecast.to_date}
        </h1>
        <p className="lede">
          Calculada solo con planes aprobados. Los importes son proyecciones; no descuentan
          inventario.
        </p>
      </section>
      <nav className="week-navigation" aria-label="Cambiar semana">
        <Link className="status" href={`/forecast?week=${shiftWeek(fromDate, -1)}` as Route}>
          ← Semana anterior
        </Link>
        <Link className="status" href={`/forecast?week=${shiftWeek(fromDate, 1)}` as Route}>
          Semana siguiente →
        </Link>
      </nav>
      <section className="foundation-list" aria-labelledby="forecast-lines-title">
        <h2 id="forecast-lines-title">Ingredientes proyectados</h2>
        <DemandTable items={forecast.items} />
      </section>
    </div>
  );
}
