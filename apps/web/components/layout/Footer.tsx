"use client";

import Image from "next/image";
import Link from "next/link";
import { Navigation } from "lucide-react";
import { FadeUp } from "@/components/ui/FadeUp";

const mapEmbedSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d439.4560241494744!2d83.98665739556925!3d28.217999357761567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399595e718456229%3A0x5a51698daf03db03!2sDakshinkali%20Electronic%20Center!5e0!3m2!1sen!2snp!4v1779349861344!5m2!1sen!2snp";

const directionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=Dakshinkali+Electronic+Center,+New+Road,+Pokhara,+Kaski,+Nepal";

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24" fill="none">
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
      <circle cx="16.7" cy="7.3" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.5V3.2c-.7-.1-1.5-.2-2.2-.2-2.3 0-3.9 1.4-3.9 3.9v1.5H8.4v3h2.4V21h3.1v-9.6h2.5l.4-3h-2.6Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.04 3.1a8.75 8.75 0 0 0-7.5 13.25L3.5 20.9l4.65-1.02A8.75 8.75 0 1 0 12.04 3.1Zm0 1.72a7.03 7.03 0 0 1 5.96 10.77 7.04 7.04 0 0 1-8.83 2.6l-.3-.14-2.72.6.62-2.63-.17-.31a7.03 7.03 0 0 1 5.44-10.89Zm-2.7 3.5c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.66 2.66 4.1 3.62 2.03.8 2.45.64 2.9.6.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.1-.49.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46Z" />
    </svg>
  );
}

function ViberIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.05 3.2c-3.18 0-5.76.77-7.18 2.15-1.2 1.16-1.77 2.86-1.77 5.18 0 2.54.7 4.3 2.14 5.39.38.28.8.5 1.27.68v3.52c0 .38.46.57.73.3l3.35-3.35h1.46c3.18 0 5.76-.77 7.18-2.15 1.2-1.16 1.77-2.86 1.77-5.18s-.58-4.02-1.77-5.18C17.8 3.97 15.23 3.2 12.05 3.2Zm0 1.66c2.7 0 4.92.6 6.02 1.66.84.82 1.27 2.06 1.27 3.72 0 1.66-.43 2.91-1.27 3.72-1.1 1.06-3.32 1.66-6.02 1.66H9.9l-1.73 1.73v-2l-.6-.2c-.54-.18-.98-.4-1.31-.65-1-.75-1.5-2.15-1.5-4.16 0-1.66.43-2.9 1.27-3.72 1.1-1.06 3.32-1.66 6.02-1.66Zm-2.23 2.63c-.22-.02-.4.06-.54.24l-.38.5c-.16.22-.24.48-.16.74.36 1.28 1.05 2.48 2.05 3.48 1 1 2.2 1.7 3.48 2.05.26.08.52 0 .74-.16l.5-.38c.18-.14.26-.32.24-.54-.04-.4-.36-.94-.78-1.22-.24-.16-.52-.18-.78-.06l-.62.3c-.18.09-.4.05-.54-.09l-1.38-1.38a.47.47 0 0 1-.09-.54l.3-.62c.12-.26.1-.54-.06-.78-.28-.42-.82-.74-1.22-.78Zm3.04.28c-.2 0-.36.16-.36.36s.16.36.36.36c1.28 0 2.31 1.03 2.31 2.31 0 .2.16.36.36.36s.36-.16.36-.36a3.03 3.03 0 0 0-3.03-3.03Zm0 1.18c-.2 0-.36.16-.36.36s.16.36.36.36c.63 0 1.13.5 1.13 1.13 0 .2.16.36.36.36s.36-.16.36-.36a1.85 1.85 0 0 0-1.85-1.85Z" />
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
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
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
                    className="inline-flex size-14 items-center justify-center rounded-full border-2 border-primary bg-white/8 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1117]"
                  >
                    <Icon aria-hidden="true" />
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
                  src="/images/logo-placeholder.webp"
                  alt="Dakshinkali Electronics logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span>Dakshinkali Electronics</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
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
                          className="text-sm text-white/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-white/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <p className="mt-4 text-sm font-semibold text-white/85">
              Dakshinkali Electronic Center
            </p>
            <p className="mt-2 text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">
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
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1117] sm:text-sm"
            >
              <Navigation className="size-4 shrink-0" aria-hidden="true" />
              Get directions
            </a>
          </FadeUp>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
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
