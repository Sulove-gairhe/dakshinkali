'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { HeroGrid } from '@/components/hero-grid'
import { ApplianceStrip } from '@/components/appliance-strip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  images?: Array<{ url: string }>
}

type CartItem = {
  id: string
  productId: string
  productName: string
  quantity: number
  priceAtAddition: number
  subtotal: number
  isAvailable: boolean
}

type Cart = {
  id: string
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
}

type Order = {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

type Profile = {
  id: string
  email: string
  fullName?: string | null
  phone?: string | null
  role?: string
}

function getSessionId() {
  const key = 'dakshinkali_session_id'
  let value = window.localStorage.getItem(key)

  if (!value) {
    value = crypto.randomUUID()
    window.localStorage.setItem(key, value)
  }

  return value
}

export default function WebStorePage() {
  const [token, setToken] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState('Ready')
  const [checkout, setCheckout] = useState({
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    line1: '',
    city: 'Kathmandu',
    state: 'Bagmati',
    postalCode: '44600',
  })

  const headers = useMemo(() => {
    const result: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) result.Authorization = `Bearer ${token}`
    if (sessionId) result['X-Session-ID'] = sessionId

    return result
  }, [token, sessionId])

  useEffect(() => {
    const currentSessionId = getSessionId()
    setSessionId(currentSessionId)
    void loadProducts()
  }, [])

  useEffect(() => {
    if (sessionId) void loadCart()
  }, [sessionId, token])

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed with ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async function run(label: string, action: () => Promise<void>) {
    setStatus(`${label}...`)
    try {
      await action()
      setStatus(`${label} complete`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Request failed')
    }
  }

  async function loadProducts() {
    await run('Loading products', async () => {
      const result = await request<{ data: Product[] }>('/api/v1/products')
      setProducts(result.data || [])
    })
  }

  async function loadCart() {
    await run('Loading cart', async () => {
      const result = await request<Cart>('/api/v1/cart')
      setCart(result)
    })
  }

  async function loadOrders() {
    await run('Loading orders', async () => {
      const result = await request<{ data: Order[] }>('/api/v1/orders')
      setOrders(result.data || [])
    })
  }

  async function loadProfile() {
    await run('Loading profile', async () => {
      const result = await request<Profile>('/api/v1/profile')
      setProfile(result)

      setCheckout((current) => ({
        ...current,
        customerEmail: current.customerEmail || result.email || '',
        customerName: current.customerName || result.fullName || '',
        customerPhone: current.customerPhone || result.phone || '',
      }))
    })
  }

  async function addToCart(productId: string) {
    await run('Adding item', async () => {
      const result = await request<Cart>('/api/v1/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })
      setCart(result)
    })
  }

  async function updateQuantity(itemId: string, quantity: number) {
    await run('Updating cart', async () => {
      const result = await request<Cart>(`/api/v1/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      })
      setCart(result)
    })
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      })

      await loadCart()
      await loadOrders()
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dakshinkali Store</h1>
              <p className="mt-1 text-sm text-muted-foreground">{status}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Session ID: {sessionId || 'Initializing...'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Login Page
              </Link>

              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Customer access token"
                className="min-w-[260px] rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
              />

              <button
                type="button"
                onClick={() => void loadProfile()}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Profile
              </button>

              <button
                type="button"
                onClick={() => void loadOrders()}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Orders
              </button>

              <button
                type="button"
                onClick={() => void loadProducts()}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Refresh Products
              </button>

              <button
                type="button"
                onClick={() => void loadCart()}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Refresh Cart
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2 grid-cols-1">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Products</h2>
              <span className="text-sm text-muted-foreground">
                {products.length} items
              </span>
            </div>

            <div className="grid gap-3">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products loaded.</p>
              ) : (
                products.map((product) => (
                  <article
                    key={product.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.category} · Rs. {product.price}
                      </p>
                      {product.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => void addToCart(product.id)}
                      className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Add
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cart</h2>
              <span className="text-sm text-muted-foreground">
                {cart?.itemCount || 0} items
              </span>
            </div>

            <div className="grid gap-3">
              {(cart?.items || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              ) : (
                cart?.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{item.productName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Qty {item.quantity} · Rs. {item.subtotal}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void updateQuantity(item.id, Math.max(0, item.quantity - 1))
                          }
                          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Subtotal: Rs. {cart?.subtotal || 0}</p>
                <p className="mt-1 text-base font-semibold">Total: Rs. {cart?.total || 0}</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => void createOrder(event)}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">Checkout</h2>

            <div className="grid gap-3">
              <input
                value={checkout.customerEmail}
                onChange={(event) =>
                  setCheckout({ ...checkout, customerEmail: event.target.value })
                }
                placeholder="Email"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <input
                value={checkout.customerName}
                onChange={(event) =>
                  setCheckout({ ...checkout, customerName: event.target.value })
                }
                placeholder="Name"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <input
                value={checkout.customerPhone}
                onChange={(event) =>
                  setCheckout({ ...checkout, customerPhone: event.target.value })
                }
                placeholder="Phone"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <input
                value={checkout.line1}
                onChange={(event) =>
                  setCheckout({ ...checkout, line1: event.target.value })
                }
                placeholder="Address"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <button
                type="submit"
                className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Place Order
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Account</h2>
            {profile ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {profile.email}</p>
                <p><span className="font-medium">Name:</span> {profile.fullName || '-'}</p>
                <p><span className="font-medium">Phone:</span> {profile.phone || '-'}</p>
                <p><span className="font-medium">Role:</span> {profile.role || 'customer'}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No profile loaded.</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Recent Orders</h2>
            <div className="grid gap-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders loaded.</p>
              ) : (
                orders.map((order) => (
                  <article
                    key={order.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                  >
                    <div>
                      <h3 className="font-semibold">{order.orderNumber}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {order.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}