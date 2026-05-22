'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgePercent,
  CreditCard,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  ShieldCheck,
  User,
  UserRound,
} from 'lucide-react';
import { SiteNavbar } from '@/components/site-navbar';
import { createApiClient } from '@/lib/api-client';
import { useAuth } from '@dakshinkali/auth';

type Profile = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: string;
  avatarUrl?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

type ShippingAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: ShippingAddress;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
};

const availableCoupons = [
  {
    code: 'DASH10',
    title: '10% off home appliances',
    detail: 'Valid on refrigerators, freezers, and washing machines.',
  },
  {
    code: 'TVSAVE',
    title: 'Rs 2,000 off selected televisions',
    detail: 'Applicable on eligible smart TV orders above Rs 75,000.',
  },
];

const usedCoupons = [
  {
    code: 'WELCOME5',
    title: 'Welcome discount',
    detail: 'Used on your previous order.',
  },
];

export default function AccountPage() {
  const { user, session, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState('Loading account...');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
  });

  const api = useMemo(
    () => createApiClient({ accessToken: session?.access_token ?? null }),
    [session?.access_token],
  );

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      if (loading) {
        setStatus('Loading account...');
        return;
      }

      if (!user || !session?.access_token) {
        setProfile(null);
        setOrders([]);
        setSelectedOrder(null);
        setStatus('Please sign in to view your account.');
        return;
      }

      setStatus('Fetching your profile and orders...');

      try {
        const [profileResult, ordersResult] = await Promise.all([
          api.request<Profile>('/api/v1/profile'),
          api.request<{ data: Order[] }>('/api/v1/orders'),
        ]);

        if (cancelled) return;

        setProfile(profileResult);
        setOrders(ordersResult.data || []);
        setSelectedOrder(null);
        setForm({
          fullName: profileResult.fullName || '',
          phone: profileResult.phone || '',
          avatarUrl: profileResult.avatarUrl || '',
        });
        setStatus('Account synced with your live profile and order history.');
      } catch (requestError) {
        if (cancelled) return;

        setStatus(requestError instanceof Error ? requestError.message : 'Unable to load account.');
      }
    };

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [api, loading, session?.access_token, user]);

  async function saveProfile() {
    if (!session?.access_token) return;

    setSaving(true);
    setError('');

    try {
      const updated = await api.request<Profile>('/api/v1/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          avatarUrl: form.avatarUrl || null,
        }),
      });

      setProfile(updated);
      setEditing(false);
      setStatus('Profile updated successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function loadOrder(orderId: string) {
    try {
      const detail = await api.request<OrderDetail>(`/api/v1/orders/${orderId}`);
      setSelectedOrder(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load order details.');
    }
  }

  async function handleLogout() {
    setError('');
    await signOut();
    setProfile(null);
    setOrders([]);
    setSelectedOrder(null);
    setStatus('You have been signed out.');
  }

  const displayName = profile?.fullName || user?.email || 'Customer';
  const memberStatus = user ? 'Active' : 'Signed out';

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
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setEditing((value) => !value)}
                  className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Pencil className="h-4 w-4" />
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex w-fit items-center gap-2 rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-bold text-secondary-foreground transition-colors hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            <ProfileMetric label="Member status" value={memberStatus} />
            <ProfileMetric label="Saved coupons" value="2 available" />
            <ProfileMetric label="Open orders" value={`${orders.length} total`} />
          </div>
        </div>

        {!user ? (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Please sign in to access your account page.</p>
            <Link href="/login" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Go to Login
            </Link>
          </div>
        ) : (
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
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    className="inline-flex w-fit items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-4 sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <User className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                        <p className="truncate text-sm font-bold">{displayName}</p>
                      </div>
                    </div>
                  </div>

                  <DetailField icon={ShieldCheck} label="Role" value={profile?.role || 'customer'} />
                  <DetailField icon={Mail} label="Email address" value={profile?.email || user.email || '-'} />
                  <DetailField
                    icon={Phone}
                    label="Phone"
                    value={profile?.phone || '-'}
                    editable={editing}
                    inputValue={form.phone}
                    onInputChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                  />
                  <DetailField
                    icon={UserRound}
                    label="Display name"
                    value={profile?.fullName || '-'}
                    editable={editing}
                    inputValue={form.fullName}
                    onInputChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
                  />
                </div>

                {error ? (
                  <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <div className="mt-4 text-sm text-muted-foreground">{status}</div>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <AddressCard
                  title="Billing Address"
                  icon={CreditCard}
                  lines={[
                    displayName,
                    'Kuleshwor, Kathmandu',
                    'Bagmati Province, Nepal',
                    `Phone: ${profile?.phone || user.user_metadata?.phone || '+977 9800000000'}`,
                  ]}
                />
                <AddressCard
                  title="User Address"
                  icon={MapPin}
                  lines={[
                    'Home delivery address',
                    'Dakshinkali Road',
                    'Kathmandu 44600, Nepal',
                    'Delivery preference: Call before arrival',
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
                      Shipping workflow preview for your real order history.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    {orders.length === 0 ? 'No orders yet' : `${orders.length} order(s)`}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No orders loaded yet.
                      </div>
                    ) : (
                      orders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => void loadOrder(order.id)}
                          className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/40"
                        >
                          <div>
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{order.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">Rs. {order.total}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    {selectedOrder ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Selected order
                          </p>
                          <h3 className="mt-1 text-lg font-bold">{selectedOrder.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">{selectedOrder.status}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Customer:</span> {selectedOrder.customerName}</p>
                          <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                          <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone || '-'}</p>
                          <p><span className="font-medium">Total:</span> Rs. {selectedOrder.total}</p>
                          <p><span className="font-medium">Payment:</span> {selectedOrder.paymentMethod}</p>
                          <p><span className="font-medium">Status:</span> {selectedOrder.paymentStatus}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                          <p className="font-medium">Shipping</p>
                          <p className="mt-1 text-muted-foreground">{selectedOrder.shippingAddress.line1}</p>
                          <p className="text-muted-foreground">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                          <p className="text-muted-foreground">{selectedOrder.shippingAddress.postalCode}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                        Select an order to view details.
                      </div>
                    )}
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
                  {orders.length === 0 ? 'No completed orders to show yet.' : 'Pick an order from the left to inspect it.'}
                </div>
              </section>
            </aside>
          </div>
        )}
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

function DetailField({
  icon: Icon,
  label,
  value,
  editable = false,
  inputValue,
  onInputChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  editable?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {editable && onInputChange ? (
            <input
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          ) : (
            <p className="truncate text-sm font-bold">{value}</p>
          )}
        </div>
      </div>
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
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5 text-primary" />
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
          ? 'rounded-md border border-primary/40 bg-primary/10 p-4'
          : 'rounded-md border border-border bg-muted/40 p-4'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded bg-background px-2 py-1 text-xs font-bold">
          {code}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {active ? 'Available' : 'Used'}
        </span>
      </div>
      <h4 className="mt-3 text-sm font-bold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </article>
  );
}
