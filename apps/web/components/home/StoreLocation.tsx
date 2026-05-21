"use client";

import { MapPin, MessageCircle, Navigation, Phone, Store } from "lucide-react";
import { FadeUp } from "@/components/ui/FadeUp";

const mapSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d439.4560241494744!2d83.98665739556925!3d28.217999357761567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399595e718456229%3A0x5a51698daf03db03!2sDakshinkali%20Electronic%20Center!5e0!3m2!1sen!2snp!4v1779349861344!5m2!1sen!2snp";

const directionsUrl =
  "https://www.google.com/maps/search/?api=1&query=Dakshinkali%20Electronic%20Center%20Pokhara%20Nepal";

const storeDetails = [
  {
    label: "Address",
    value: "Dakshinkali Electronic Center, Pokhara, Gandaki Province, Nepal",
  },
  {
    label: "Phone",
    value: "+977 9846069986 · +977 9846514318",
  },
  {
    label: "WhatsApp",
    value: "+977 9846514318",
  },
  {
    label: "Hours",
    value: "Sun - Fri: 9:00 AM - 7:00 PM · Saturday: 10:00 AM - 5:00 PM",
  },
  {
    label: "Since",
    value: "Serving Pokhara since 2001",
  },
];

function StoreDetailValue({ label, value }: { label: string; value: string }) {
  if (label === "Phone") {
    return (
      <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm leading-6 text-muted-foreground">
        <a
          href="tel:+9779846069986"
          className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          +977 9846069986
        </a>
        <span className="text-muted-foreground">·</span>
        <a
          href="tel:+9779846514318"
          className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          +977 9846514318
        </a>
      </p>
    );
  }

  if (label === "WhatsApp") {
    return (
      <a
        href="https://wa.me/9779846514318"
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex text-sm leading-6 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {value}
      </a>
    );
  }

  return <p className="mt-1 text-sm leading-6 text-muted-foreground">{value}</p>;
}

export function StoreLocation() {
  return (
    <section className="bg-background py-12 text-foreground sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mb-8 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            Find us
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Visit our store in Pokhara
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Come see, touch, and compare before you buy. We&apos;ve been serving
            Pokhara since 2001.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <FadeUp className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <iframe
              title="Dakshinkali Electronic Center location in Pokhara"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[320px] w-full sm:min-h-[360px]"
            />
          </FadeUp>

          <FadeUp
            delay={120}
            className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start gap-3 border-b border-border pb-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground ring-1 ring-primary/25">
                <Store className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Dakshinkali Electronic Center
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Local advice, hands-on comparison, and support after purchase.
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-4">
              {storeDetails.map((detail) => (
                <div key={detail.label}>
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {detail.label === "Address" && (
                      <MapPin className="size-3.5" aria-hidden="true" />
                    )}
                    {detail.label === "Phone" && (
                      <Phone className="size-3.5" aria-hidden="true" />
                    )}
                    {detail.label === "WhatsApp" && (
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                    )}
                    {detail.label}
                  </dt>
                  <dd>
                    <StoreDetailValue
                      label={detail.label}
                      value={detail.value}
                    />
                  </dd>
                </div>
              ))}
            </dl>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Get directions
            </a>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
