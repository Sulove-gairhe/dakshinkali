'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  images?: Array<{ url: string }>;
};

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtAddition: number;
  subtotal: number;
  isAvailable: boolean;
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

type Profile = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: string;
};

function getSessionId() {
  const key = 'dakshinkali_session_id';
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

export default function WebStorePage() {
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState('Ready');
  const [checkout, setCheckout] = useState({
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    line1: '',
    city: 'Kathmandu',
    state: 'Bagmati',
    postalCode: '44600',
  });

  const headers = useMemo(() => {
    const result: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) result.Authorization = `Bearer ${token}`;
    if (sessionId) result['X-Session-ID'] = sessionId;
    return result;
  }, [token, sessionId]);

  useEffect(() => {
    const currentSessionId = getSessionId();
    setSessionId(currentSessionId);
    void loadProducts();
  }, []);

  useEffect(() => {
    if (sessionId) void loadCart();
  }, [sessionId, token]);

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

  async function loadProducts() {
    await run('Loading products', async () => {
      const result = await request<{ data: Product[] }>('/api/v1/products');
      setProducts(result.data || []);
    });
  }

  async function loadCart() {
    await run('Loading cart', async () => {
      const result = await request<Cart>('/api/v1/cart');
      setCart(result);
    });
  }

  async function loadOrders() {
    await run('Loading orders', async () => {
      const result = await request<{ data: Order[] }>('/api/v1/orders');
      setOrders(result.data || []);
    });
  }

  async function loadProfile() {
    await run('Loading profile', async () => {
      const result = await request<Profile>('/api/v1/profile');
      setProfile(result);
      setCheckout((current) => ({
        ...current,
        customerEmail: current.customerEmail || result.email || '',
        customerName: current.customerName || result.fullName || '',
        customerPhone: current.customerPhone || result.phone || '',
      }));
    });
  }

  async function addToCart(productId: string) {
    await run('Adding item', async () => {
      const result = await request<Cart>('/api/v1/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setCart(result);
    });
  }

  async function updateQuantity(itemId: string, quantity: number) {
    await run('Updating cart', async () => {
      const result = await request<Cart>(`/api/v1/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      setCart(result);
    });
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run('Creating order', async () => {
      await request<Order>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: checkout.customerEmail,
          customerName: checkout.customerName,
          customerPhone: checkout.customerPhone || null,
          shippingAddress: {
            line1: checkout.line1,
            city: checkout.city,
            state: checkout.state,
            postalCode: checkout.postalCode,
            country: 'Nepal',
          },
          paymentMethod: 'cash_on_delivery',
        }),
      });
      await loadCart();
      await loadOrders();
    });
  }

  return (
    <main style={styles.shell}>
      <section style={styles.toolbar}>
        <div>
          <h1 style={styles.title}>Dakshinkali Store</h1>
          <p style={styles.status}>{status}</p>
        </div>
        <input
          style={styles.token}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Customer access token"
        />
        <button style={styles.button} onClick={() => void loadProfile()}>Profile</button>
        <button style={styles.button} onClick={() => void loadOrders()}>Orders</button>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2 style={styles.heading}>Products</h2>
          <div style={styles.list}>
            {products.map((product) => (
              <article key={product.id} style={styles.row}>
                <div>
                  <strong>{product.name}</strong>
                  <p style={styles.muted}>{product.category} · Rs. {product.price}</p>
                </div>
                <button style={styles.button} onClick={() => void addToCart(product.id)}>Add</button>
              </article>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.heading}>Cart</h2>
          <div style={styles.list}>
            {(cart?.items || []).map((item) => (
              <article key={item.id} style={styles.row}>
                <div>
                  <strong>{item.productName}</strong>
                  <p style={styles.muted}>Qty {item.quantity} · Rs. {item.subtotal}</p>
                </div>
                <div style={styles.actions}>
                  <button style={styles.button} onClick={() => void updateQuantity(item.id, Math.max(0, item.quantity - 1))}>-</button>
                  <button style={styles.button} onClick={() => void updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
              </article>
            ))}
            <strong>Total: Rs. {cart?.total || 0}</strong>
          </div>
        </div>

        <form style={styles.panel} onSubmit={(event) => void createOrder(event)}>
          <h2 style={styles.heading}>Checkout</h2>
          <input style={styles.input} value={checkout.customerEmail} onChange={(event) => setCheckout({ ...checkout, customerEmail: event.target.value })} placeholder="Email" />
          <input style={styles.input} value={checkout.customerName} onChange={(event) => setCheckout({ ...checkout, customerName: event.target.value })} placeholder="Name" />
          <input style={styles.input} value={checkout.customerPhone} onChange={(event) => setCheckout({ ...checkout, customerPhone: event.target.value })} placeholder="Phone" />
          <input style={styles.input} value={checkout.line1} onChange={(event) => setCheckout({ ...checkout, line1: event.target.value })} placeholder="Address" />
          <button style={styles.primary} type="submit">Place Order</button>
        </form>

        <div style={styles.panel}>
          <h2 style={styles.heading}>Account</h2>
          <p style={styles.muted}>{profile ? `${profile.email} (${profile.role || 'customer'})` : 'No profile loaded'}</p>
          <h3 style={styles.subheading}>Recent Orders</h3>
          <div style={styles.list}>
            {orders.map((order) => (
              <article key={order.id} style={styles.row}>
                <strong>{order.orderNumber}</strong>
                <span style={styles.muted}>{order.status} · Rs. {order.total}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', padding: 24, background: '#f6f7f9', color: '#17202a', fontFamily: 'system-ui, sans-serif' },
  toolbar: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 28 },
  status: { margin: '4px 0 0', color: '#52616f' },
  token: { minWidth: 280, flex: 1, maxWidth: 520, padding: 10, border: '1px solid #c9d1d9', borderRadius: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  panel: { background: '#ffffff', border: '1px solid #d8dee4', borderRadius: 8, padding: 16 },
  heading: { margin: '0 0 12px', fontSize: 18 },
  subheading: { margin: '16px 0 8px', fontSize: 15 },
  list: { display: 'grid', gap: 10 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #eef1f4', paddingBottom: 10 },
  muted: { margin: 0, color: '#667085', fontSize: 13 },
  actions: { display: 'flex', gap: 6 },
  input: { width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid #c9d1d9', borderRadius: 6, marginBottom: 10 },
  button: { border: '1px solid #9aa6b2', background: '#ffffff', color: '#17202a', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' },
  primary: { border: '1px solid #14532d', background: '#166534', color: '#ffffff', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', width: '100%' },
};
