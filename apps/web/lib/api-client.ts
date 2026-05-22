const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export interface ApiClientOptions {
  accessToken?: string | null
  sessionId?: string | null
}

export function createApiClient({
  accessToken,
  sessionId,
}: ApiClientOptions = {}) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, API_URL)
    const headers = new Headers(init.headers)

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    if (sessionId) {
      headers.set('X-Session-ID', sessionId)
    }

    const response = await fetch(url, {
      ...init,
      headers,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed with ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return response.json()
    }

    return (await response.text()) as T
  }

  return {
    request,
    baseUrl: API_URL,
  }
}
