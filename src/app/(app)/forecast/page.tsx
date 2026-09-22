import Link from "next/link";
import type { Route } from "next";

import { DemandTable } from "@/components/forecast/DemandTable";
import { ErrorState } from "@/components/states/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { ApiRequestError, serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatWeekRangeLong } from "@/lib/format";
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
        actionHref={"/settings/household" as Route}
        actionLabel="Ir al hogar"
        description="Necesitas una membresía activa para ver la previsión de demanda."
        title="Sin acceso al hogar"
      />
    );
  }
  if ("error" in forecast) {
    return <ErrorState description={forecast.error} title="No se pudo cargar la previsión" />;
  }

  const shortfalls = forecast.items.filter((item) => Number(item.shortfall_amount) > 0);

  return (
    <>
      <div className="planner-toolbar">
        <nav aria-label="Cambiar de semana" className="week-nav">
          <Link
            aria-label="Semana anterior"
            className="icon-btn"
            href={`/forecast?week=${shiftWeek(fromDate, -1)}` as Route}
          >
            <Icon name="chevron" size={16} />
          </Link>
          <div className="week-identity">
            <strong>Semana del {formatWeekRangeLong(fromDate)}</strong>
            <span>
              {forecast.from_date} — {forecast.to_date}
            </span>
          </div>
          <Link
            aria-label="Semana siguiente"
            className="icon-btn"
            href={`/forecast?week=${shiftWeek(fromDate, 1)}` as Route}
          >
            <Icon name="chevron" size={16} />
          </Link>
        </nav>
        <span className="week-summary">
          {forecast.items.length} ingredientes · {shortfalls.length} con faltantes
        </span>
      </div>

      <article className="card card-flush">
        <div className="card-title">
          <div>
            <h2>Demanda proyectada</h2>
            <span className="muted">
              Calculada solo con planes aprobados. Son proyecciones: no descuentan inventario.
            </span>
          </div>
          <Link className="btn btn-ghost" href={"/inventario" as Route}>
            Ir a la despensa
          </Link>
        </div>
        <DemandTable items={forecast.items} />
      </article>
    </>
  );
}
