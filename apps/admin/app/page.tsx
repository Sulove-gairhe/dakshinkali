'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type DashboardStats = {
  products: { total: number };
  orders: { totalOrders: number; revenue: number; pendingOrders: number };
  users: { totalUsers: number; adminUsers: number };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  total: number;
  createdAt: string;
};

type User = {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  createdAt: string;
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState('Enter an admin token to load data');

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  useEffect(() => {
    if (token) void refreshAll();
  }, [token]);

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with ${response.status}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  }

  async function run(label: string, action: () => Promise<void>) {
    setStatus(`${label}...`);
    try {
      await action();
      setStatus(`${label} complete`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function refreshAll() {
    await run('Refreshing admin data', async () => {
      const [dashboard, orderResult, userResult] = await Promise.all([
        request<DashboardStats>('/api/v1/admin/dashboard/stats'),
        request<{ data: Order[] }>('/api/v1/admin/orders'),
        request<{ data: User[] }>('/api/v1/admin/users'),
      ]);
      setStats(dashboard);
      setOrders(orderResult.data || []);
      setUsers(userResult.data || []);
    });
  }

  async function updateOrderStatus(orderId: string, nextStatus: string) {
    await run('Updating order', async () => {
      await request(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshAll();
    });
  }

  async function updateUserRole(userId: string, role: string) {
    await run('Updating role', async () => {
      await request(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await refreshAll();
    });
  }

  return (
    <main style={styles.shell}>
      <section style={styles.toolbar}>
        <div>
          <h1 style={styles.title}>Dakshinkali Admin</h1>
          <p style={styles.status}>{status}</p>
        </div>
        <input
          style={styles.token}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Admin access token"
        />
        <button style={styles.primary} onClick={() => void refreshAll()}>Refresh</button>
      </section>

      <section style={styles.metrics}>
        <div style={styles.metric}><span>Products</span><strong>{stats?.products.total ?? 0}</strong></div>
        <div style={styles.metric}><span>Orders</span><strong>{stats?.orders.totalOrders ?? 0}</strong></div>
        <div style={styles.metric}><span>Revenue</span><strong>Rs. {stats?.orders.revenue ?? 0}</strong></div>
        <div style={styles.metric}><span>Users</span><strong>{stats?.users.totalUsers ?? 0}</strong></div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2 style={styles.heading}>Orders</h2>
          <div style={styles.list}>
            {orders.map((order) => (
              <article key={order.id} style={styles.row}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p style={styles.muted}>{order.customerName} · {order.status} · Rs. {order.total}</p>
                </div>
                <select style={styles.select} value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </article>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.heading}>Users</h2>
          <div style={styles.list}>
            {users.map((user) => (
              <article key={user.id} style={styles.row}>
                <div>
                  <strong>{user.email}</strong>
                  <p style={styles.muted}>{user.fullName || 'No name'} · {user.role}</p>
                </div>
                <select style={styles.select} value={user.role} onChange={(event) => void updateUserRole(user.id, event.target.value)}>
                  <option value="customer">customer</option>
                  <option value="admin">admin</option>
                </select>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', padding: 24, background: '#f5f6f8', color: '#111827', fontFamily: 'system-ui, sans-serif' },
  toolbar: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 28 },
  status: { margin: '4px 0 0', color: '#5b6472' },
  token: { minWidth: 280, flex: 1, maxWidth: 560, padding: 10, border: '1px solid #c8d0d9', borderRadius: 6 },
  primary: { border: '1px solid #1f4f46', background: '#1f6f5f', color: '#ffffff', borderRadius: 6, padding: '10px 12px', cursor: 'pointer' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 },
  metric: { background: '#ffffff', border: '1px solid #d9e0e7', borderRadius: 8, padding: 14, display: 'grid', gap: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 },
  panel: { background: '#ffffff', border: '1px solid #d9e0e7', borderRadius: 8, padding: 16 },
  heading: { margin: '0 0 12px', fontSize: 18 },
  list: { display: 'grid', gap: 10 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #edf0f3', paddingBottom: 10 },
  muted: { margin: 0, color: '#667085', fontSize: 13 },
  select: { padding: 8, border: '1px solid #c8d0d9', borderRadius: 6, background: '#ffffff' },
};
