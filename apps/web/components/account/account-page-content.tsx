"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgePercent,
  CreditCard,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@dakshinkali/auth";
import { SiteNavbar } from "@/components/site-navbar";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const workflowSteps = [
  "Order Placed",
  "Payment Review",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

export function AccountPageContent() {
  const router = useRouter();
  const { user, profile, loading, isAuthenticated, signOut, session } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirectTo=${encodeURIComponent("/account")}`);
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!session?.access_token || !API_URL) {
      setOrders([]);
      if (!API_URL) {
        setOrdersMessage(
          "Order history will appear here when the storefront API is connected.",
        );
      }
      return;
    }

    let cancelled = false;

    async function loadOrders() {
      const accessToken = session?.access_token;
      if (!accessToken) {
        return;
      }

      setOrdersLoading(true);
      setOrdersMessage(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/orders`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load your orders right now.");
        }

        const payload = (await response.json()) as {
          data?: OrderSummary[];
        };

        if (!cancelled) {
          setOrders(payload.data ?? []);
          if (!payload.data?.length) {
            setOrdersMessage("No orders yet for this account.");
          }
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setOrdersMessage(
            "Order history is not available yet. Your account is ready for future purchases.",
          );
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  if (loading || !isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading your account...
      </main>
    );
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.toString() ||
    "Dakshinkali Customer";
  const displayEmail = profile?.email || user.email || "";
  const memberRole = profile?.role === "admin" ? "Admin" : "Customer";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const accountDetails = [
    { label: "Name", value: displayName, icon: User },
    {
      label: "Account type",
      value: memberRole,
      icon: ShieldCheck,
    },
    { label: "Email address", value: displayEmail, icon: Mail },
    {
      label: "User ID",
      value: user.id.slice(0, 8) + "…",
      icon: Phone,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-secondary px-5 py-6 text-secondary-foreground sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Customer Dashboard
            </p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">My Account</h1>
                <p className="mt-2 max-w-2xl text-sm text-secondary-foreground/75">
                  Signed in as {displayEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            <ProfileMetric label="Member status" value="Active" />
            <ProfileMetric
              label="Saved coupons"
              value="Apply at checkout"
            />
            <ProfileMetric
              label="Your orders"
              value={
                ordersLoading
                  ? "Loading..."
                  : `${orders.length} on record`
              }
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold">Account Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Profile data for your signed-in account only.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {accountDetails.map((detail) => {
                  const DetailIcon = detail.icon;

                  return (
                    <div
                      key={detail.label}
                      className="rounded-md border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                          <DetailIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {detail.label}
                          </p>
                          <p className="truncate text-sm font-bold">
                            {detail.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <AddressCard
                title="Billing Address"
                icon={CreditCard}
                lines={[
                  displayName,
                  "Add your billing address at checkout.",
                ]}
              />
              <AddressCard
                title="Delivery Address"
                icon={MapPin}
                lines={[
                  "Saved delivery addresses will appear here.",
                  "Complete checkout to store an address.",
                ]}
              />
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Password & security</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use the sign-in page forgot-password flow to reset your
                    password securely.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
                  >
                    Go to sign in
                  </Link>
                </div>
              </div>
            </section>

            <section
              id="orders"
              className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Orders</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Order history linked to your user account.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </span>
              </div>

              {orders.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-md border border-border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{order.orderNumber}</p>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Total: Rs {order.total.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {ordersLoading
                    ? "Loading orders..."
                    : ordersMessage ?? "No orders yet."}
                </div>
              )}

              <div className="mt-6 overflow-x-auto">
                <div className="flex min-w-[720px] items-center">
                  {workflowSteps.map((step, index) => (
                    <div key={step} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center text-center">
                        <span
                          className={
                            index === 0
                              ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                              : "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-muted-foreground"
                          }
                        >
                          {index + 1}
                        </span>
                        <span className="mt-2 text-xs font-semibold">
                          {step}
                        </span>
                      </div>
                      {index < workflowSteps.length - 1 && (
                        <div className="mx-3 h-px flex-1 bg-border" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <BadgePercent className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">My Coupons</h2>
                  <p className="text-sm text-muted-foreground">
                    Offers tied to your account.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Available coupon codes can be applied in the cart or checkout
                  summary when they match your order.
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Wishlist</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saved items are stored in this browser. Sign in keeps your
                    profile and orders in sync when the API is enabled.
                  </p>
                  <Link
                    href="/wishlist"
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary/80"
                  >
                    View wishlist
                  </Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}

function AddressCard({
  title,
  icon: Icon,
  lines,
}: {
  title: string;
  icon: React.ElementType;
  lines: string[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

