# Dakshinkali Electronics Platform

Monorepo for ecommerce storefront + admin dashboard + business management system.

## 📚 Documentation

- **[Installation Guide](./INSTALLATION.md)** - Setup instructions
- **[API Documentation](./apps/api/docs/)** - API reference and guides

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Apps will be available at:
# - Web: http://localhost:3000
# - Admin: http://localhost:3001
# - API: http://localhost:3002
```

## 📦 Project Structure

```
apps/
  ├── web/          # Next.js storefront (port 3000)
  ├── admin/        # Next.js admin panel (port 3001)
  └── api/          # Express API server (port 3002)
packages/
  └── database/     # Supabase client + storage config
agent/
  └── docs/         # AI-generated documentation
.kiro/
  ├── specs/        # Feature specifications
  └── steering/     # AI steering rules and context
```

## ✅ Completed Features

- ✅ **Product Module** - Full CRUD with image storage
- ✅ **Monorepo Setup** - Turborepo + pnpm workspaces
- ✅ **Database** - Supabase PostgreSQL + Storage
- ✅ **API Layer** - Express with layered architecture

## 🚧 In Progress

- ⚠️ **Authentication** - Mock auth active (needs real implementation)
- ⚠️ **Cart Module** - Database only (needs code implementation)

## 📋 Roadmap

- [ ] Implement Supabase Auth integration
- [ ] Complete Cart module
- [ ] Build Order module
- [ ] Add Payment integration
- [ ] Production deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Backend**: Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Monorepo**: Turborepo, pnpm

## 📖 Learn More

- [Project Status & Context](./.kiro/steering/project_status.md)
- [API Quick Reference](./apps/api/docs/API_QUICK_REFERENCE.md)
