import { InventoryView, type InventoryRowData } from "@/components/inventory/InventoryView";
import type { LotOption } from "@/components/inventory/InventoryAdjustmentForm";
import type { IngredientOption } from "@/components/inventory/InventoryLotForm";
import { ErrorState } from "@/components/states/ErrorState";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import { formatDayMonth, formatWeekRangeLong, relativeDay, toIsoDay } from "@/lib/format";
import { weekWindow } from "@/lib/forecast/window";

type Lot = components["schemas"]["InventoryLotResponse"];
type DemandLine = components["schemas"]["DemandForecastLine"];

async function loadInventory(): Promise<Lot[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: Lot[] }>("/inventory?include_expired=true");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadIngredients(): Promise<IngredientOption[]> {
  try {
    const data = await serverHouseholdFetch<{ items: IngredientOption[] }>("/ingredients");
    return data.items;
  } catch {
    return [];
  }
}

async function loadForecast(fromDate: string, toDate: string): Promise<DemandLine[]> {
  try {
    const data = await serverHouseholdFetch<{ items: DemandLine[] }>(
      `/forecast/demand?from_date=${fromDate}&to_date=${toDate}`,
    );
    return data.items;
  } catch {
    return [];
  }
}

const EXPIRING_SOON_DAYS = 3;

function buildRows(
  lots: Lot[],
  forecast: DemandLine[],
  ingredients: IngredientOption[],
): InventoryRowData[] {
  const today = toIsoDay(new Date());
  const names = new Map(ingredients.map((item) => [item.id, item.name]));
  const units = new Map(ingredients.map((item) => [item.id, item.base_unit]));
  const demandByIngredient = new Map(forecast.map((line) => [line.ingredient_id, line]));

  const byIngredient = new Map<string, Lot[]>();
  for (const lot of lots) {
    byIngredient.set(lot.ingredient_id, [...(byIngredient.get(lot.ingredient_id) ?? []), lot]);
  }

  const ingredientIds = new Set<string>([...byIngredient.keys(), ...demandByIngredient.keys()]);

  const rows: InventoryRowData[] = [...ingredientIds].map((ingredientId) => {
    const ingredientLots = byIngredient.get(ingredientId) ?? [];
    const demand = demandByIngredient.get(ingredientId);
    const unit = ingredientLots[0]?.unit ?? demand?.unit ?? units.get(ingredientId) ?? "unit";

    const usableLots = ingredientLots.filter((lot) => lot.available && !lot.expired);
    const real = usableLots.reduce((sum, lot) => sum + Number(lot.quantity_on_hand), 0);
    const required = demand ? Number(demand.required_amount) + Number(demand.optional_amount) : null;
    const projected = required === null ? real : real - required;
    const shortfall = Math.max(0, -(projected));

    const locations = [...new Set(ingredientLots.map((lot) => lot.location))];
    const expiringLots = usableLots
      .filter((lot) => lot.expiration_date)
      .map((lot) => lot.expiration_date as string)
      .sort();
    const nextExpiry = expiringLots[0] ?? null;
    const expirySoon =
      nextExpiry !== null &&
      nextExpiry >= today &&
      nextExpiry <= toIsoDay(new Date(Date.now() + EXPIRING_SOON_DAYS * 86_400_000));

    let statusTone: InventoryRowData["statusTone"] = "available";
    let statusLabel = "Disponible";
    if (ingredientLots.length > 0 && usableLots.length === 0) {
      statusTone = "missing";
      statusLabel = "Caducado";
    } else if (shortfall > 0) {
      statusTone = "missing";
      statusLabel = `Faltan ${shortfall.toLocaleString("es", { maximumFractionDigits: 3 })} ${unit}`;
    } else if (expirySoon) {
      statusTone = "expiring";
      statusLabel = `Vence ${relativeDay(nextExpiry ?? today, today)}`;
    }

    return {
      ingredientId,
      name: names.get(ingredientId) ?? demand?.ingredient_name ?? "Ingrediente",
      unit,
      locations,
      real: String(real),
      projected: String(projected),
      required: required === null ? null : String(required),
      expiryLabel: nextExpiry
        ? `${formatDayMonth(nextExpiry)} · ${relativeDay(nextExpiry, today)}`
        : null,
      statusTone,
      statusLabel,
      lots: ingredientLots.map((lot) => ({
        id: lot.id,
        location: lot.location,
        quantity: lot.quantity_on_hand,
        unit: lot.unit,
        expirationDate: lot.expiration_date ?? null,
        expirationLabel: lot.expiration_date
          ? `${formatDayMonth(lot.expiration_date)} · ${relativeDay(lot.expiration_date, today)}`
          : null,
        expired: lot.expired,
        available: lot.available,
      })),
    };
  });

  const toneRank = { missing: 0, expiring: 1, available: 2 };
  rows.sort(
    (a, b) => toneRank[a.statusTone] - toneRank[b.statusTone] || a.name.localeCompare(b.name, "es"),
  );
  return rows;
}

export default async function InventoryPage() {
  const { fromDate, toDate } = weekWindow();
  const [data, ingredients, forecast] = await Promise.all([
    loadInventory(),
    loadIngredients(),
    loadForecast(fromDate, toDate),
  ]);
  if ("error" in data) {
    return (
      <ErrorState description={data.error} title="No se pudo cargar el inventario" />
    );
  }

  const names = new Map(ingredients.map((item) => [item.id, item.name]));
  const lotOptions: LotOption[] = data
    .filter((lot) => lot.available && !lot.expired)
    .map((lot) => ({
      id: lot.id,
      ingredientName: names.get(lot.ingredient_id) ?? lot.ingredient_id,
      quantity: lot.quantity_on_hand,
      unit: lot.unit,
    }));

  return (
    <InventoryView
      ingredients={ingredients}
      lotOptions={lotOptions}
      rows={buildRows(data, forecast, ingredients)}
      weekLabel={formatWeekRangeLong(fromDate)}
    />
  );
}
