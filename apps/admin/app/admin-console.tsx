'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { getUserRole, useAuth } from '@dakshinkali/auth';
import { Loader2, LockKeyhole, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type DashboardStats = {
  products: { total: number };
  orders: { totalOrders: number; revenue: number; pendingOrders: number };
  users: { totalUsers: number; adminUsers: number };
};

type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  price: number;
  category: string;
  status: string;
  images: Array<{ id: string; url: string; order: number }>;
  specs?: Record<string, unknown>;
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

type ProductForm = {
  id?: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  category: string;
  status: string;
  specs: string;
  images: File[];
};

type LoginForm = {
  email: string;
  password: string;
};

const emptyProductForm: ProductForm = {
  name: '',
  brand: '',
  description: '',
  price: '',
  category: 'televisions',
  status: 'active',
  specs: '{\n  "features": []\n}',
  images: [],
};

export function AdminConsole() {
  const { session, loading: authLoading, signIn, signOut, supabase } = useAuth();
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [submittingLogin, setSubmittingLogin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState('Sign in with an admin account to load data');
  const [activeView, setActiveView] = useState<'products' | 'orders' | 'users'>('products');
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [productMessage, setProductMessage] = useState('');

  const isAdmin = role === 'admin';
  const accessToken = session?.access_token || '';

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (authLoading) {
        return;
      }

      if (!session || !supabase) {
        setRole(null);
        setRoleLoading(false);
        setStatus('Sign in with an admin account to load data');
        return;
      }

      setRoleLoading(true);

      try {
        const metadataRole = session.user.app_metadata?.role || session.user.user_metadata?.role || null;
        const resolvedRole = metadataRole || (await getUserRole(supabase));

        if (!cancelled) {
          setRole(resolvedRole);
          setStatus(resolvedRole === 'admin' ? 'Admin session ready' : 'Admin access required');
        }
      } catch (error) {
        if (!cancelled) {
          setRole(null);
          setStatus(error instanceof Error ? error.message : 'Failed to resolve admin role');
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session, supabase]);

  useEffect(() => {
    if (!isAdmin || !accessToken) {
      return;
    }

    void refreshAll();
  }, [accessToken, isAdmin]);

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const bodyIsForm = options.body instanceof FormData;
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string> | undefined),
      },
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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingLogin(true);
    setStatus('Signing in...');

    try {
      const { error } = await signIn(loginForm.email, loginForm.password);

      if (error) {
        setStatus(error.message);
        return;
      }

      setStatus('Checking admin access...');
    } finally {
      setSubmittingLogin(false);
    }
  }

  async function handleLogout() {
    await signOut();
    setRole(null);
    setStats(null);
    setProducts([]);
    setOrders([]);
    setUsers([]);
    setProductForm(emptyProductForm);
    setProductMessage('');
    setStatus('Signed out');
  }

  async function refreshAll() {
    if (!isAdmin || !accessToken) {
      setStatus('Admin access required to load data');
      return;
    }

    await run('Refreshing admin data', async () => {
      const [dashboard, productResult, orderResult, userResult] = await Promise.all([
        request<DashboardStats>('/api/v1/admin/dashboard/stats'),
        request<{ data: Product[] }>('/api/v1/admin/products?pageSize=100'),
        request<{ data: Order[] }>('/api/v1/admin/orders?pageSize=50'),
        request<{ data: User[] }>('/api/v1/admin/users?pageSize=50'),
      ]);
      setStats(dashboard);
      setProducts(productResult.data || []);
      setOrders(orderResult.data || []);
      setUsers(userResult.data || []);
    });
  }

  function updateProductForm(field: keyof ProductForm, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }));
    setProductMessage('');
  }

  function updateProductImages(event: ChangeEvent<HTMLInputElement>) {
    setProductForm((current) => ({
      ...current,
      images: Array.from(event.target.files || []),
    }));
  }

  function editProduct(product: Product) {
    setActiveView('products');
    setProductForm({
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      status: product.status,
      specs: JSON.stringify(product.specs || { features: [] }, null, 2),
      images: [],
    });
  }

  function buildProductFormData() {
    const data = new FormData();
    data.set('name', productForm.name);
    data.set('price', productForm.price);
    data.set('category', productForm.category);
    data.set('status', productForm.status);
    data.set('specs', productForm.specs || '{}');
    if (productForm.brand.trim()) {
      data.set('brand', productForm.brand.trim());
    }
    if (productForm.description.trim()) {
      data.set('description', productForm.description.trim());
    }
    productForm.images.forEach((file) => data.append('images', file));
    return data;
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin || !accessToken) {
      setProductMessage('Sign in with an admin account before creating or updating products.');
      return;
    }

    if (!productForm.name.trim()) {
      setProductMessage('Product name is required.');
      return;
    }

    const price = Number(productForm.price);
    if (!Number.isFinite(price) || price <= 0) {
      setProductMessage('Enter a valid product price greater than 0.');
      return;
    }

    if (!productForm.category.trim()) {
      setProductMessage('Category is required. Use values like televisions, refrigerators, or water-geyser.');
      return;
    }

    try {
      JSON.parse(productForm.specs || '{}');
    } catch {
      setProductMessage('Specs JSON is invalid. Fix the JSON or use {}.');
      return;
    }

    await run(productForm.id ? 'Updating product' : 'Creating product', async () => {
      if (productForm.id) {
        await request<Product>(`/api/v1/admin/products/${productForm.id}`, {
          method: 'PUT',
          body: buildProductFormData(),
        });
      } else {
        await request<Product>('/api/v1/admin/products', {
          method: 'POST',
          body: buildProductFormData(),
        });
      }
      setProductForm(emptyProductForm);
      setProductMessage(productForm.id ? 'Product updated.' : 'Product created.');
      await refreshAll();
    });
  }

  async function deleteProduct(productId: string) {
    await run('Deleting product', async () => {
      await request<void>(`/api/v1/admin/products/${productId}`, { method: 'DELETE' });
      await refreshAll();
    });
  }

  async function updateProductStatus(product: Product, nextStatus: string) {
    const data = new FormData();
    data.set('status', nextStatus);

    await run('Updating product status', async () => {
      await request<Product>(`/api/v1/admin/products/${product.id}`, {
        method: 'PUT',
        body: data,
      });
      await refreshAll();
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

  async function updateUserRole(userId: string, nextRole: string) {
    await run('Updating role', async () => {
      await request(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      await refreshAll();
    });
  }

  if (authLoading || roleLoading) {
    return (
      <main className="admin-shell admin-auth-shell">
        <section className="admin-auth-panel">
          <Loader2 className="admin-auth-spinner" />
          <p className="admin-auth-title">Checking secure access</p>
          <p className="admin-auth-copy">Loading your session and admin role.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-shell admin-auth-shell">
        <section className="admin-auth-panel admin-auth-panel-wide">
          <div className="admin-auth-copy-block">
            <p className="admin-eyebrow">Operations console</p>
            <h1 className="admin-auth-title">Admin sign in</h1>
            <p className="admin-auth-copy">Use an admin Supabase account to access the dashboard.</p>
          </div>

          <form className="admin-auth-form" onSubmit={handleLogin}>
            <label className="admin-label">
              <span className="admin-label-icon"><Mail className="h-4 w-4" /> Email</span>
              <input
                className="admin-input"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                autoComplete="email"
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="admin-label">
              <span className="admin-label-icon"><LockKeyhole className="h-4 w-4" /> Password</span>
              <input
                className="admin-input"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
            </label>

            <button className="admin-button admin-button-primary" type="submit" disabled={submittingLogin}>
              {submittingLogin ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="admin-form-message admin-auth-message">
            <ShieldCheck className="h-4 w-4" /> {status}
          </p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell admin-auth-shell">
        <section className="admin-auth-panel admin-auth-panel-wide">
          <div className="admin-auth-copy-block">
            <p className="admin-eyebrow">Access denied</p>
            <h1 className="admin-auth-title">Admin role required</h1>
            <p className="admin-auth-copy">You are signed in, but this account does not have admin access.</p>
          </div>

          <div className="admin-auth-role">
            <ShieldAlert className="h-5 w-5" />
            <span>Signed in as {session.user.email}</span>
          </div>

          <button className="admin-button admin-button-secondary" type="button" onClick={() => void handleLogout()}>
            Sign out
          </button>

          <p className="admin-form-message admin-auth-message">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-toolbar">
        <div className="admin-toolbar-copy">
          <p className="admin-eyebrow">Operations console</p>
          <h1 className="admin-title">Dakshinkali Admin</h1>
          <p className="admin-status">{status}</p>
        </div>
        <div className="admin-toolbar-session">
          <div className="admin-toolbar-session-copy">
            <span>Signed in</span>
            <strong>{session.user.email}</strong>
          </div>
          <button className="admin-button admin-button-secondary" type="button" onClick={() => void handleLogout()}>
            Sign out
          </button>
        </div>
        <button className="admin-button admin-button-primary" type="button" onClick={() => void refreshAll()}>
          Refresh
        </button>
      </section>

      <section className="admin-metrics">
        <div className="admin-metric"><span>Products</span><strong>{stats?.products.total ?? products.length}</strong></div>
        <div className="admin-metric"><span>Orders</span><strong>{stats?.orders.totalOrders ?? orders.length}</strong></div>
        <div className="admin-metric"><span>Revenue</span><strong>Rs. {stats?.orders.revenue ?? 0}</strong></div>
        <div className="admin-metric"><span>Users</span><strong>{stats?.users.totalUsers ?? users.length}</strong></div>
      </section>

      <nav className="admin-tabs">
        {(['products', 'orders', 'users'] as const).map((view) => (
          <button
            key={view}
            type="button"
            className={activeView === view ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
      </nav>

      {activeView === 'products' ? (
        <section className="admin-product-grid">
          <form className="admin-panel admin-product-form" onSubmit={saveProduct}>
            <h2 className="admin-heading">{productForm.id ? 'Edit Product' : 'Create Product'}</h2>
            <div className="admin-form-grid">
              <label className="admin-label">Name<input className="admin-input" value={productForm.name} onChange={(event) => updateProductForm('name', event.target.value)} /></label>
              <label className="admin-label">Brand<input className="admin-input" value={productForm.brand} onChange={(event) => updateProductForm('brand', event.target.value)} /></label>
              <label className="admin-label">Price<input type="number" min="1" className="admin-input" value={productForm.price} onChange={(event) => updateProductForm('price', event.target.value)} /></label>
              <label className="admin-label">Category<input className="admin-input" value={productForm.category} onChange={(event) => updateProductForm('category', event.target.value)} /></label>
              <label className="admin-label">Status<select className="admin-input" value={productForm.status} onChange={(event) => updateProductForm('status', event.target.value)}><option value="active">active</option><option value="inactive">inactive</option><option value="out_of_stock">out_of_stock</option></select></label>
              <label className="admin-label">Images<input className="admin-input" type="file" accept="image/*" multiple onChange={updateProductImages} /></label>
              <label className="admin-label admin-span-all">Description<textarea className="admin-textarea" value={productForm.description} onChange={(event) => updateProductForm('description', event.target.value)} /></label>
              <label className="admin-label admin-span-all">Specs JSON<textarea className="admin-textarea" value={productForm.specs} onChange={(event) => updateProductForm('specs', event.target.value)} /></label>
            </div>
            {productMessage ? <p className="admin-form-message">{productMessage}</p> : null}
            <div className="admin-actions">
              <button className="admin-button admin-button-primary" type="submit">{productForm.id ? 'Update product' : 'Create product'}</button>
              {productForm.id ? <button className="admin-button admin-button-secondary" type="button" onClick={() => setProductForm(emptyProductForm)}>Cancel</button> : null}
            </div>
          </form>

          <div className="admin-panel">
            <h2 className="admin-heading">Products</h2>
            <div className="admin-list">
              {products.map((product) => (
                <article key={product.id} className="admin-row admin-product-row">
                  <div className="admin-row-copy">
                    <strong>{product.name}</strong>
                    <p className="admin-muted">{product.category} - {product.status} - Rs. {product.price}</p>
                  </div>
                  <div className="admin-row-actions">
                    <select className="admin-select" value={product.status} onChange={(event) => void updateProductStatus(product, event.target.value)}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="out_of_stock">out_of_stock</option>
                    </select>
                    <button className="admin-button admin-button-secondary" type="button" onClick={() => editProduct(product)}>Edit</button>
                    <button className="admin-button admin-button-danger" type="button" onClick={() => void deleteProduct(product.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'orders' ? (
        <section className="admin-panel admin-main-panel">
          <h2 className="admin-heading">Orders</h2>
          <div className="admin-list">
            {orders.map((order) => (
              <article key={order.id} className="admin-row">
                <div className="admin-row-copy">
                  <strong>{order.orderNumber}</strong>
                  <p className="admin-muted">{order.customerName} - {order.status} - Rs. {order.total}</p>
                </div>
                <select className="admin-select" value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}>
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
        </section>
      ) : null}

      {activeView === 'users' ? (
        <section className="admin-panel admin-main-panel">
          <h2 className="admin-heading">Users</h2>
          <div className="admin-list">
            {users.map((user) => (
              <article key={user.id} className="admin-row">
                <div className="admin-row-copy">
                  <strong>{user.email}</strong>
                  <p className="admin-muted">{user.fullName || 'No name'} - {user.role}</p>
                </div>
                <select className="admin-select" value={user.role} onChange={(event) => void updateUserRole(user.id, event.target.value)}>
                  <option value="customer">customer</option>
                  <option value="admin">admin</option>
                </select>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
