import {
  InventoryView,
  type InventoryRowData,
  type PendingShoppingRow,
  type ShoppingBandData,
} from "@/components/inventory/InventoryView";
import type { LotOption } from "@/components/inventory/InventoryAdjustmentForm";
import type { IngredientOption } from "@/components/inventory/InventoryLotForm";
import { ErrorState } from "@/components/states/ErrorState";
import { serverHouseholdFetch } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/schema";
import {
  formatDayMonth,
  formatDayShort,
  formatWeekRangeLong,
  relativeDay,
  toIsoDay,
} from "@/lib/format";
import { weekWindow } from "@/lib/forecast/window";

type Lot = components["schemas"]["InventoryLotResponse"];
type DemandLine = components["schemas"]["DemandForecastLine"];
type ShoppingList = components["schemas"]["ShoppingListResponse"];
type ShoppingItem = components["schemas"]["ShoppingItemResponse"];

async function loadInventory(): Promise<Lot[] | { error: string }> {
  try {
    const data = await serverHouseholdFetch<{ items: Lot[] }>("/inventory?include_expired=true");
    return data.items;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inténtalo de nuevo." };
  }
}

async function loadShoppingList(): Promise<ShoppingList | null> {
  try {
    return await serverHouseholdFetch<ShoppingList>("/shopping-lists/current");
  } catch {
    return null;
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
    } else if (real === 0) {
      statusTone = "low";
      statusLabel = "Sin stock";
    }

    const tags: InventoryRowData["tags"] = [];
    if (shortfall > 0) tags.push({ tone: "missing", label: "Falta" });
    if (expirySoon) tags.push({ tone: "expiring", label: "Por caducar" });
    if (usableLots.length > 0 && ingredientLots.some((lot) => lot.expired)) {
      tags.push({ tone: "warning", label: "Con caducados" });
    }
    if (real === 0 && usableLots.length > 0) {
      tags.push({ tone: "low", label: "Sin stock" });
    }

    return {
      ingredientId,
      name: names.get(ingredientId) ?? demand?.ingredient_name ?? "Ingrediente",
      unit,
      locations,
      real: String(real),
      projected: String(projected),
      required: required === null ? null : String(required),
      shortage:
        shortfall > 0 && required !== null
          ? {
              needed: String(required),
              onHand: String(real),
              missing: String(shortfall),
            }
          : null,
      expiryLabel: nextExpiry
        ? `${formatDayMonth(nextExpiry)} · ${relativeDay(nextExpiry, today)}`
        : null,
      statusTone,
      statusLabel,
      tags,
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

  const toneRank = { missing: 0, expiring: 1, low: 2, available: 3 };
  rows.sort(
    (a, b) => toneRank[a.statusTone] - toneRank[b.statusTone] || a.name.localeCompare(b.name, "es"),
  );
  return rows;
}

function buildShoppingBand(
  list: ShoppingList | null,
  forecast: DemandLine[],
): ShoppingBandData {
  if (list === null) {
    return { list: null, pendingRows: [], resolvedItems: [] };
  }
  const demandByIngredient = new Map(forecast.map((line) => [line.ingredient_id, line]));
  const pendingRows: PendingShoppingRow[] = list.items
    .filter((item: ShoppingItem) => item.status === "pending")
    .map((item: ShoppingItem) => {
      const demand = demandByIngredient.get(item.ingredient_id);
      return {
        item,
        onHand: demand?.on_hand_amount ?? null,
        shortfall: demand?.shortfall_amount ?? null,
      };
    });
  return {
    list: {
      id: list.id,
      state: list.state,
      version: list.version,
      windowLabel: `${formatDayShort(list.from_date)} – ${formatDayMonth(list.to_date)}`,
    },
    pendingRows,
    resolvedItems: list.items.filter((item: ShoppingItem) => item.status !== "pending"),
  };
}

export default async function InventoryPage() {
  const { fromDate, toDate } = weekWindow();
  const [data, ingredients, forecast, list] = await Promise.all([
    loadInventory(),
    loadIngredients(),
    loadForecast(fromDate, toDate),
    loadShoppingList(),
  ]);
  if ("error" in data) {
    return (
      <ErrorState description={data.error} title="No se pudo cargar la despensa" />
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
      shopping={buildShoppingBand(list, forecast)}
      weekLabel={formatWeekRangeLong(fromDate)}
      windowDefault={{ from: fromDate, to: toDate }}
    />
  );
}
