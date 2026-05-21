"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type FadeUpProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
};

export function FadeUp({
  children,
  className,
  delay = 0,
  style,
  ...props
}: FadeUpProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        "motion-reduce:transition-none",
        className,
      )}
      style={
        {
          ...style,
          transitionDelay: `${delay}ms`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
