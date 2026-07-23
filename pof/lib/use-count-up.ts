"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number toward `target` with an ease-out curve. Starts from 0 on
 * mount (the load animation) and re-animates from the previous value whenever
 * the target changes. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
