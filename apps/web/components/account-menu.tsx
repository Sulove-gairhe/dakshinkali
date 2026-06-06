"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Package, User } from "lucide-react";
import { useAuth } from "@dakshinkali/auth";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  className?: string;
  variant?: "desktop" | "mobile";
};

export function AccountMenu({ className, variant = "desktop" }: AccountMenuProps) {
  const router = useRouter();
  const { user, profile, loading, isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push("/login");
  }

  if (loading) {
    return (
      <div
        className={cn(
          variant === "desktop"
            ? "flex flex-col items-center gap-1 opacity-60"
            : "flex h-10 w-10 items-center justify-center",
          className,
        )}
        aria-hidden
      >
        <User className="h-5 w-5" />
        {variant === "desktop" ? (
          <span className="text-[10px] font-medium uppercase tracking-wide">
            Account
          </span>
        ) : null}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (variant === "mobile") {
      return (
        <Link
          href="/login"
          aria-label="Sign in"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted",
            className,
          )}
        >
        <User className="h-5 w-5" />
        </Link>
      );
    }

    return (
      <Link
        href="/login"
        className={cn(
          "group flex flex-col items-center gap-1 text-foreground",
          className,
        )}
      >
        <User className="h-5 w-5 transition-colors duration-300 group-hover:text-primary" />
        <span className="text-[10px] font-medium uppercase tracking-wide">
          Sign In
        </span>
      </Link>
    );
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Account";

  if (variant === "mobile") {
    return (
      <Link
        href="/account"
        aria-label="My account"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted",
          className,
        )}
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex flex-col items-center gap-1 text-foreground"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="relative flex items-center gap-0.5">
          <User className="h-5 w-5 transition-colors duration-300 group-hover:text-primary" />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open ? "rotate-180" : "",
            )}
          />
        </div>
        <span className="max-w-[72px] truncate text-[10px] font-medium uppercase tracking-wide">
          {displayName}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[90] mt-3 w-52 rounded-lg border border-border bg-card py-2 text-card-foreground shadow-2xl"
        >
          <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
            {user.email}
          </p>
          <AccountMenuLink href="/account" onNavigate={() => setOpen(false)}>
            My Account
          </AccountMenuLink>
          <AccountMenuLink
            href="/account#orders"
            onNavigate={() => setOpen(false)}
          >
            <Package className="h-4 w-4" />
            My Orders
          </AccountMenuLink>
          <AccountMenuLink
            href="/wishlist"
            onNavigate={() => setOpen(false)}
          >
            Wishlist
          </AccountMenuLink>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AccountMenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted hover:text-primary"
    >
      {children}
    </Link>
  );
}
