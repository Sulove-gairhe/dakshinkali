"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { FadeUp } from "@/components/ui/FadeUp";

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none">
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
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.5V3.2c-.7-.1-1.5-.2-2.2-.2-2.3 0-3.9 1.4-3.9 3.9v1.5H8.4v3h2.4V21h3.1v-9.6h2.5l.4-3h-2.6Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12 2 12s0 3 .4 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1C22 15 22 12 22 12s0-3-.4-4.8ZM10 15.4V8.6l5.8 3.4L10 15.4Z" />
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
    icon: MessageCircle,
  },
  {
    label: "YouTube",
    href: "#",
    icon: YoutubeIcon,
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
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-[1.35fr_0.8fr_0.9fr]">
          <FadeUp>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-secondary-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative size-12 overflow-hidden rounded-full border border-white/10 bg-white">
                <Image
                  src="/images/logo-placeholder.jpeg"
                  alt="Dakshinkali Electronics logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span>Dakshinkali Electronics</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-secondary-foreground/65">
              Pokhara&apos;s trusted electronics shop since 2001.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                const isPlaceholder = social.href === "#";

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-secondary-foreground/75 transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                    onClick={(event) => {
                      if (isPlaceholder) event.preventDefault();
                    }}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </FadeUp>

          {footerColumns.map((column, columnIndex) => (
            <FadeUp key={column.title} delay={(columnIndex + 1) * 80}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-secondary-foreground">
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
                          className="text-sm text-secondary-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-secondary-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-secondary-foreground/45 sm:flex-row sm:items-center sm:justify-between">
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
