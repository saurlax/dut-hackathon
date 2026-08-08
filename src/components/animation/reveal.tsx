"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
