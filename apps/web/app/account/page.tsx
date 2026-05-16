"use client";

import {
  BadgePercent,
  CreditCard,
  Home,
  KeyRound,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";

const accountDetails = [
  { label: "Name", value: "Dakshinkali Customer", icon: User },
  { label: "Display name", value: "dakshinkali.customer", icon: ShieldCheck },
  { label: "Email address", value: "customer@dakshinkali.com", icon: Mail },
  { label: "Phone", value: "+977 9800000000", icon: Phone },
];

const availableCoupons = [
  {
    code: "DASH10",
    title: "10% off home appliances",
    detail: "Valid on refrigerators, freezers, and washing machines.",
  },
  {
    code: "TVSAVE",
    title: "Rs 2,000 off selected televisions",
    detail: "Applicable on eligible smart TV orders above Rs 75,000.",
  },
];

const usedCoupons = [
  {
    code: "WELCOME5",
    title: "Welcome discount",
    detail: "Used on your previous order.",
  },
];

const workflowSteps = [
  "Order Placed",
  "Payment Review",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

export default function AccountPage() {
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
                  Manage your profile, addresses, coupons, and order activity.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            <ProfileMetric label="Member status" value="Active" />
            <ProfileMetric label="Saved coupons" value="2 available" />
            <ProfileMetric label="Open orders" value="0 pending" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Account Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Personal information used for checkout and service updates.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex w-fit items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Update
                </button>
              </div>

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
                  "Dakshinkali Electronics Customer",
                  "Kuleshwor, Kathmandu",
                  "Bagmati Province, Nepal",
                  "Phone: +977 9800000000",
                ]}
              />
              <AddressCard
                title="User Address"
                icon={MapPin}
                lines={[
                  "Home delivery address",
                  "Dakshinkali Road",
                  "Kathmandu 44600, Nepal",
                  "Delivery preference: Call before arrival",
                ]}
              />
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">Change Password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep your account secure with a strong password.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <PasswordField label="Current password" />
                    <PasswordField label="New password" />
                    <PasswordField label="Confirm password" />
                  </div>

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
                  >
                    Save Password
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Orders</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Shipping workflow preview for future order history.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  No orders yet
                </span>
              </div>

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
                    Available and previously used offers.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  Available Coupons
                </h3>
                <div className="mt-3 space-y-3">
                  {availableCoupons.map((coupon) => (
                    <CouponCard key={coupon.code} {...coupon} active />
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  Used Coupons
                </h3>
                <div className="mt-3 space-y-3">
                  {usedCoupons.map((coupon) => (
                    <CouponCard key={coupon.code} {...coupon} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Order Snapshot</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your recent purchases and shipment details will appear here.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No completed orders to show yet.
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Edit
        </button>
      </div>

      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

function PasswordField({ label }: { label: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="password"
        placeholder="••••••••"
        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function CouponCard({
  code,
  title,
  detail,
  active = false,
}: {
  code: string;
  title: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <article
      className={
        active
          ? "rounded-md border border-primary/40 bg-primary/10 p-4"
          : "rounded-md border border-border bg-muted/40 p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded bg-background px-2 py-1 text-xs font-bold">
          {code}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {active ? "Available" : "Used"}
        </span>
      </div>
      <h4 className="mt-3 text-sm font-bold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}
