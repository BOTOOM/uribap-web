"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function MotionReveal({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
