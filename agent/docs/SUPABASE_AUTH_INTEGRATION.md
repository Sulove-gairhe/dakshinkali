# Supabase Auth Integration Guide

**Production-Ready Implementation for Turborepo + pnpm Monorepo**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema & Migration](#database-schema--migration)
3. [Package Installation](#package-installation)
4. [Environment Variables](#environment-variables)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation (Next.js)](#frontend-implementation-nextjs)
7. [Testing & Verification](#testing--verification)
8. [Security Best Practices](#security-best-practices)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web App     │  │  Admin App   │  │  Auth Utils  │      │
│  │  (port 3000) │  │  (port 3001) │  │  (shared)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    Bearer Token (JWT)                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express API (port 3002)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Middleware (JWT Verification)                  │   │
│  │  - Verify Supabase JWT                               │   │
│  │  - Extract user from token                           │   │
│  │  - Attach to req.user                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Role Middleware (Authorization)                     │   │
│  │  - Check user.role                                   │   │
│  │  - Enforce admin-only routes                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Protected Routes                                    │   │
│  │  - /api/v1/admin/products (admin only)              │   │
│  │  - /api/v1/profile (authenticated)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth        │  │  Database    │  │  Storage     │      │
│  │  (JWT)       │  │  (Postgres)  │  │  (Files)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Frontend**: Uses Supabase client for auth operations (signup, login, logout)
- **Backend**: Verifies JWT tokens, never trusts client claims
- **Database**: Profiles table synced with auth.users via trigger
- **Security**: Row Level Security (RLS) + API-level authorization

---

## Database Schema & Migration

### 1. Create Profiles Table Migration

