"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Evita ResponsiveContainer do Recharts com React 19 (erros em runtime / ref).
 */
export function ChartBox({
  height,
  children,
}: {
  height: number;
  children: (width: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, Math.floor(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {children(width)}
    </div>
  );
}
