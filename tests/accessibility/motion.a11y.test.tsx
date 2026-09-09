import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MotionReveal } from "@/features/foundation/MotionReveal";

describe("foundation motion contract", () => {
  it("keeps content available inside the motion boundary", () => {
    render(
      <MotionReveal>
        <p>Estado disponible sin depender del movimiento.</p>
      </MotionReveal>,
    );

    expect(screen.getByText("Estado disponible sin depender del movimiento.")).toBeVisible();
  });
});
