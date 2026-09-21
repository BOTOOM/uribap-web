import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemandTable } from "@/components/forecast/DemandTable";
import { mondayOf, shiftWeek, weekWindow } from "@/lib/forecast/window";

const LINE = {
  ingredient_id: "11111111-1111-1111-1111-111111111111",
  ingredient_name: "Arroz",
  unit: "g",
  required_amount: "700.000000",
  optional_amount: "0.000000",
  total_amount: "700.000000",
  on_hand_amount: "500.000000",
  shortfall_amount: "200.000000",
};

describe("demand forecast table", () => {
  it("renders api-verbatim amounts and a shortfall badge", () => {
    render(<DemandTable items={[LINE]} />);
    expect(screen.getByText("Arroz (g)")).toBeInTheDocument();
    expect(screen.getByText("Necesario: 700.000000")).toBeInTheDocument();
    expect(screen.getByText("En inventario: 500.000000")).toBeInTheDocument();
    expect(screen.getByText("Faltan 200.000000")).toBeInTheDocument();
  });

  it("marks covered lines without a shortfall badge", () => {
    render(<DemandTable items={[{ ...LINE, shortfall_amount: "0.000000" }]} />);
    expect(screen.getByText("Cubierto")).toBeInTheDocument();
    expect(screen.queryByText(/Faltan/)).not.toBeInTheDocument();
  });

  it("renders different units of one ingredient as separate lines", () => {
    render(
      <DemandTable
        items={[LINE, { ...LINE, unit: "kg", required_amount: "1.000000" }]}
      />,
    );
    expect(screen.getByText("Arroz (g)")).toBeInTheDocument();
    expect(screen.getByText("Arroz (kg)")).toBeInTheDocument();
  });

  it("shows an explicit empty state", () => {
    render(<DemandTable items={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/planes aprobados/);
  });
});

describe("week window", () => {
  it("aligns any date to its Monday and returns a 7-day window", () => {
    const { fromDate, toDate } = weekWindow("2026-10-01");
    expect(fromDate).toBe("2026-09-28");
    expect(toDate).toBe("2026-10-04");
  });

  it("keeps a Monday unchanged and handles Sundays", () => {
    expect(mondayOf(new Date("2026-10-04T00:00:00Z")).toISOString().slice(0, 10)).toBe(
      "2026-09-28",
    );
    expect(weekWindow("2026-09-28").fromDate).toBe("2026-09-28");
  });

  it("shifts whole weeks", () => {
    expect(shiftWeek("2026-09-28", 1)).toBe("2026-10-05");
    expect(shiftWeek("2026-09-28", -1)).toBe("2026-09-21");
  });
});
