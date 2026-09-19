"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * The count-up has to set its starting value before the browser paints,
 * otherwise the settled score renders for one frame and then snaps to zero —
 * a visible glitch. Plain useLayoutEffect warns during SSR, hence the switch.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ScoreFigureProps = {
  /** The real, final score. Rendered as-is when JS or motion is unavailable. */
  value: number;
  className?: string;
};

/**
 * A score that counts up on first paint.
 *
 * The final value is what renders server-side and what remains if JS never
 * runs, so the number on screen is always the true one — the animation
 * enhances a correct default rather than gating it. Honors
 * prefers-reduced-motion by skipping straight to the value.
 */
export function ScoreFigure({ value, className }: ScoreFigureProps) {
  const [shown, setShown] = useState(value);
  const frame = useRef<number | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duration = 1100;
    let start: number | undefined;

    setShown(0);

    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      // ease-out-quart: arrives fast, settles rather than bounces
      const eased = 1 - Math.pow(1 - progress, 4);
      setShown(Math.round(value * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return (
    <span className={className}>
      {/* aria-hidden on the animating digits; the true value is announced once
          below, so assistive tech never reads a counting blur. */}
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{value} out of 100</span>
    </span>
  );
}
