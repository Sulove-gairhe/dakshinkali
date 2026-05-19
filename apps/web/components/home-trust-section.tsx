"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const trustCards = [
  {
    title: "23+ Years Old",
    description: "Serving customers since the early 2000s.",
    icon: ShieldCheck,
    position: "lg:-left-10 lg:top-10",
    delay: 0,
    drift: -18,
    tilt: -1.8,
  },
  {
    title: "5000+ Happy Customers",
    description: "Trusted by families and repeat buyers.",
    icon: HeartHandshake,
    position: "lg:-right-10 lg:top-9",
    delay: 0.2,
    drift: 18,
    tilt: 1.8,
  },
  {
    title: "Branded Products",
    description: "Shop reliable electronics from trusted brands.",
    icon: BadgeCheck,
    position: "lg:-left-12 lg:top-[42%]",
    delay: 0.4,
    drift: 22,
    tilt: 1.5,
  },
  {
    title: "Free Delivery in Pokhara",
    description: "Fast local delivery inside Pokhara Valley.",
    icon: Truck,
    position: "lg:-right-14 lg:top-[42%]",
    delay: 0.6,
    drift: -22,
    tilt: -1.5,
  },
  {
    title: "All-in-One Electronics",
    description:
      "TVs, refrigerators, washing machines, kitchen appliances and more.",
    icon: Store,
    position: "lg:-bottom-2 lg:left-0",
    delay: 0.8,
    drift: -16,
    tilt: 1.2,
  },
  {
    title: "Warranty Support",
    description: "Buy with confidence and after-sales support.",
    icon: PackageCheck,
    position: "lg:bottom-1 lg:-right-6",
    delay: 1,
    drift: 16,
    tilt: -1.2,
  },
];

const productImages = [
  {
    src: "/images/Samsung Double door 245 Litres.png",
    alt: "Samsung double door refrigerator",
    className: "left-2 top-9 h-[78%] w-[44%] sm:left-8 sm:w-[38%]",
  },
  {
    src: "/images/Samsung 65 inch tv.png",
    alt: "Samsung smart television",
    className: "right-2 top-8 h-[42%] w-[50%] sm:right-6",
  },
  {
    src: "/images/Himstar 8kg washing machine (clearance-7).png",
    alt: "Himstar washing machine",
    className: "bottom-5 right-6 h-[38%] w-[42%] sm:right-12",
  },
];

export function HomeTrustSection() {
  const [shouldFloat, setShouldFloat] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () =>
      setShouldFloat(media.matches && !motionMedia.matches);

    updateMotion();
    media.addEventListener("change", updateMotion);
    motionMedia.addEventListener("change", updateMotion);

    return () => {
      media.removeEventListener("change", updateMotion);
      motionMedia.removeEventListener("change", updateMotion);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-[#fff8e7] via-background to-[#fffdf7] py-14 sm:py-16 lg:min-h-[92vh] lg:py-0">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex min-h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Dakshinkali Shop
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              23+ Years of Trusted Electronics
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Branded appliances, reliable service, and fast delivery for
              families across Nepal.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-6 text-foreground/70 sm:text-base">
              From daily home essentials to big appliance upgrades, Dakshinkali
              Shop helps local customers and families abroad choose electronics
              with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="group/trust-cta relative h-12 overflow-hidden rounded-full px-6 text-sm font-bold shadow-[0_14px_35px_rgba(251,191,36,0.28)] hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <Link href="/products">
                  <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/40 transition-transform duration-700 group-hover/trust-cta:translate-x-[470%]" />
                  <span className="pointer-events-none absolute inset-y-0 -left-2/3 w-1/4 skew-x-[-18deg] bg-white/25 transition-transform delay-100 duration-700 group-hover/trust-cta:translate-x-[640%]" />
                  <span className="relative">Shop Trusted Products</span>
                </Link>
              </Button>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/75">
                <Truck className="size-4 text-primary" aria-hidden="true" />
                Free delivery inside Pokhara Valley
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-full max-w-155 lg:aspect-[1.05/1] lg:min-h-140">
              <div className="absolute left-1/2 top-[43%] h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />

              <div className="relative z-10 mx-auto h-97.5 w-full max-w-112.5 overflow-hidden rounded-4xl border border-white/80 bg-white/85 shadow-[0_28px_80px_rgba(17,17,17,0.12)] backdrop-blur lg:absolute lg:left-1/2 lg:top-1/2 lg:h-[64%] lg:w-[70%] lg:max-w-none lg:-translate-x-1/2 lg:-translate-y-1/2">
                <div className="absolute inset-x-8 top-6 flex items-center justify-between">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Branded Appliances
                  </span>
                  <span className="text-xs font-bold text-foreground/65">
                    All Nepal Delivery
                  </span>
                </div>

                {productImages.map((image) => (
                  <div
                    key={image.src}
                    className={`absolute ${image.className}`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 1024px) 45vw, 260px"
                      className="object-contain drop-shadow-[0_18px_26px_rgba(17,17,17,0.16)]"
                    />
                  </div>
                ))}

                <div className="absolute inset-x-8 bottom-6 rounded-2xl border border-border/80 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    All-in-one electronics store
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    Appliances, TVs, kitchen essentials and support.
                  </p>
                </div>
              </div>

              <div className="relative z-20 mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:absolute lg:inset-0 lg:mt-0 lg:block">
                {trustCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <motion.article
                      key={card.title}
                      animate={
                        shouldFloat
                          ? {
                              x: [0, card.drift, -card.drift * 0.45, 0],
                              y: [0, -20, 10, 0],
                              rotate: [0, card.tilt, -card.tilt, 0],
                            }
                          : { x: 0, y: 0, rotate: 0 }
                      }
                      transition={{
                        duration: 4.6,
                        delay: card.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      whileHover={{ y: -14, scale: 1.03 }}
                      className={`group rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_12px_34px_rgba(17,17,17,0.08)] backdrop-blur transition-all duration-300 hover:border-primary/70 hover:shadow-[0_20px_52px_rgba(17,17,17,0.15)] sm:p-4 lg:absolute lg:w-53.75 ${card.position}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground ring-1 ring-primary/25 sm:size-11">
                          <Icon
                            className="size-4.5 sm:size-5"
                            aria-hidden="true"
                          />
                        </span>
                        <div>
                          <h3 className="text-[15px] font-bold leading-snug text-foreground sm:text-base">
                            {card.title}
                          </h3>
                          <p className="mt-1 max-h-0 translate-y-1 overflow-hidden text-[13px] leading-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-h-24 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
