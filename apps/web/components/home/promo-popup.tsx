"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const AUTO_CLOSE_SECONDS = 8;
const AUTO_CLOSE_DELAY = AUTO_CLOSE_SECONDS * 1_000;

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_CLOSE_SECONDS);

  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const openTimer = window.setTimeout(() => {
      setSecondsRemaining(AUTO_CLOSE_SECONDS);
      setIsOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const autoCloseTimer = window.setTimeout(closePopup, AUTO_CLOSE_DELAY);
    const countdownTimer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1_000);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(autoCloseTimer);
      window.clearInterval(countdownTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closePopup, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-3 py-4 animate-in fade-in duration-200 sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePopup();
      }}
    >
      <h2 id="promo-popup-title" className="sr-only">
        Dakshinkali Electronics promotional offer
      </h2>

      <div className="pointer-events-none flex w-full max-w-[56rem] flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-end gap-2 px-1">
          <p
            className="rounded-full border border-white/50 bg-white/95 px-3 py-2 text-xs font-semibold tracking-wide text-primary shadow-[0_6px_20px_rgba(8,51,90,0.14)]"
            aria-live="polite"
          >
            Auto close in: {secondsRemaining}s
          </p>
          <button
            type="button"
            onClick={closePopup}
            autoFocus
            aria-label="Close promotional banner"
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/70 bg-white text-primary shadow-[0_6px_20px_rgba(8,51,90,0.16)] transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-white/80 bg-card p-1 shadow-[0_22px_64px_rgba(8,36,61,0.26)] sm:rounded-3xl sm:p-1.5">
          <Image
            src="/images/pop%20up%20banner.png"
            alt="Dakshinkali Electronics promotional offer"
            width={1415}
            height={736}
            priority
            sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 960px) calc(100vw - 48px), 896px"
            className="h-auto w-full rounded-[0.75rem] object-contain sm:rounded-[1.125rem]"
          />
        </div>
      </div>
    </div>
  );
}
