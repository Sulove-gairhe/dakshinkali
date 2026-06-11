"use client";

import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { Navigation } from "lucide-react";
import { FadeUp } from "@/components/ui/FadeUp";

const mapEmbedSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d439.4560241494744!2d83.98665739556925!3d28.217999357761567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399595e718456229%3A0x5a51698daf03db03!2sDakshinkali%20Electronic%20Center!5e0!3m2!1sen!2snp!4v1779349861344!5m2!1sen!2snp";

const directionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=Dakshinkali+Electronic+Center,+New+Road,+Pokhara,+Kaski,+Nepal";

function InstagramIcon({ className = "size-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" {...props}>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.7" cy="7.3" r="1.1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FacebookIcon({ className = "size-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.5V3.2c-.7-.1-1.5-.2-2.2-.2-2.3 0-3.9 1.4-3.9 3.9v1.5H8.4v3h2.4V21h3.1v-9.6h2.5l.4-3h-2.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5.5 19.5 6.7 16A7.2 7.2 0 1 1 9 18.1l-3.5 1.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M9.3 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.2.7l-.4.5c.6 1 1.5 1.8 2.6 2.3l.5-.5c.2-.2.4-.3.7-.2l1.6.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.9-.5.3-1 .4-1.6.3-2.8-.5-5.1-2.6-5.9-5.3-.1-.7 0-1.4.4-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ViberIcon({ className = "size-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 4.8A8.8 8.8 0 0 1 12 3.5c4.3 0 7.5 2.7 7.5 6.9 0 4.1-2.9 6.6-6.7 6.9L9 20.5v-3.2h-.8c-2.2 0-3.7-1.5-3.7-3.8v-3.1c0-2.4.8-4.3 2.5-5.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M9.4 8.2c2.7.1 4.3 1.7 4.4 4.4M9.7 10.1c1.5.1 2.3.9 2.4 2.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M8.9 12.2c1 1.5 2.2 2.5 3.6 3 .5.1 1-.1 1.2-.5l.2-.4c.1-.3 0-.6-.3-.8l-1-.5c-.2-.1-.5-.1-.7.1l-.3.3c-.6-.3-1-.7-1.4-1.3l.3-.3c.2-.2.2-.5.1-.7l-.5-1c-.2-.3-.5-.4-.8-.3l-.4.2c-.4.2-.6.7-.5 1.2.1.3.3.7.5 1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/dakshinkalielectronics/?hl=en",
    icon: InstagramIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100054886144403",
    icon: FacebookIcon,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/9779846514318",
    icon: WhatsAppIcon,
  },
  {
    label: "Viber",
    href: "viber://chat?number=%2B9779846069986",
    icon: ViberIcon,
  },
];

const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "Televisions", href: "/search?category=televisions" },
      { label: "Refrigerators", href: "/search?category=refrigerator" },
      { label: "Washing machines", href: "/search?category=washing-machine" },
      { label: "Air conditioners", href: "/search?q=air%20conditioner" },
      { label: "Water geysers", href: "/search?q=water%20geyser" },
      { label: "Clearance deals", href: "/#clearance-deals" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Request a technician", href: "https://wa.me/9779846514318" },
      { label: "Warranty support", href: "https://wa.me/9779846514318" },
      { label: "Exchange & returns", href: "https://wa.me/9779846514318" },
      { label: "EMI options", href: "https://wa.me/9779846514318" },
      { label: "Buying guides", href: "/blogs" },
      { label: "Contact us", href: "https://wa.me/9779846514318" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#0b1117] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <FadeUp>
          <div className="mb-10 flex flex-col items-center border-b border-white/10 pb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-white">
              Connect now
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="inline-flex size-14 items-center justify-center rounded-full border-2 border-primary bg-white/12 text-white shadow-lg transition-colors hover:border-accent hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1117]"
                  >
                    <Icon className="size-7" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </FadeUp>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.72fr_0.82fr_0.95fr]">
          <FadeUp>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-white transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative size-12 overflow-hidden rounded-full border border-white/10 bg-white">
                <Image
                  src="/images/logo-placeholder white.png"
                  alt="Dakshinkali Electronics logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span>Dakshinkali Electronics</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
              Pokhara&apos;s trusted electronics shop since 2001.
            </p>
            <div className="mt-4 w-full max-w-[220px] sm:max-w-[260px]">
              <Image
                src="/images/download.png"
                alt="Download our store app or catalog"
                width={260}
                height={130}
                className="h-auto w-full object-contain object-left"
                sizes="(max-width: 640px) 220px, 260px"
              />
            </div>
          </FadeUp>

          {footerColumns.map((column, columnIndex) => (
            <FadeUp key={column.title} delay={(columnIndex + 1) * 80}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => {
                  const isExternal = link.href.startsWith("http");

                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-white/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-white/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </FadeUp>
          ))}

          <FadeUp delay={240}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-white">
              Visit Us
            </h2>
            <p className="mt-4 text-sm font-semibold text-white/90">
              Dakshinkali Electronic Center
            </p>
            <p className="mt-2 text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">
              Pokhara (New Road), Kaski
              <br />
              In front of the Old Metropolitan Office
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
              <iframe
                src={mapEmbedSrc}
                title="Dakshinkali Electronic Center — Pokhara (New Road), Kaski"
                className="aspect-4/3 h-auto min-h-[160px] w-full border-0 sm:min-h-[180px]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary sm:text-sm"
            >
              <Navigation className="size-4 shrink-0" aria-hidden="true" />
              <Navigation className="size-4 shrink-0" aria-hidden="true" />
              Get directions
            </a>
          </FadeUp>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} Dakshinkali Electronics, Pokhara. All rights
            reserved.
          </p>
          <p>Made with ♥ for Nepal</p>
        </div>
      </div>
    </footer>
  );
}
