import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered entrance using tailwindcss-animate utilities.
 * Applies `animate-in fade-in slide-in-from-bottom-* ` once the element enters the viewport.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        shown
          ? "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 ease-out"
          : "opacity-0",
        className
      )}
    >
      {children}
    </Tag>
  );
}
