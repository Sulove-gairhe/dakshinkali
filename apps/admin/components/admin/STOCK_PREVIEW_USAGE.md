# Stock Preview Box - Usage Guide

## Overview

The Stock Preview Box displays read-only pending stock impact (manual deduction pending) from active orders (confirmed/processing/shipped status). This is part of the Admin Order-Stock Integration (Phase 2E) feature.

## Architecture

### Server-Only Service Layer
- **File**: `apps/admin/lib/admin/stock-impact.ts`
- **Marker**: `import "server-only"`
- **Purpose**: Query service using service-role Supabase client
- **Cannot be imported directly into client components**

### Server Action Wrapper
- **File**: `apps/admin/lib/admin/actions/stock-preview.ts`
- **Marker**: `"use server"`
- **Purpose**: Safe cross-boundary wrapper exposing server-only service to client
- **Function**: `getStockImpactPreviewAction(productId: string)`

### Client Hook
- **File**: `apps/admin/lib/admin/hooks/useStockImpactPreview.ts`
- **Marker**: `"use client"`
- **Purpose**: React hook for fetching data from client components
- **Returns**: `{ items, isLoading, error, refetch }`

### Presentational Component
- **File**: `apps/admin/components/admin/stock-preview-box.tsx`
- **Marker**: `"use client"`
- **Purpose**: Render stock preview boxes with loading/error/empty states
- **Props**: `{ items, isLoading, error }`

## Usage Example

```tsx
"use client";

import { useStockImpactPreview } from "@/lib/admin/hooks/useStockImpactPreview";
import { StockPreviewBox } from "./stock-preview-box";

export function ProductForm({ productId }: { productId: string }) {
  const { items, isLoading, error, refetch } = useStockImpactPreview(productId);

  return (
    <div>
      {/* ... other form fields ... */}
      
      <div>
        <label className="text-sm font-medium">Stock quantity</label>
        <input type="number" value={stockQuantity} />
        
        {/* Stock preview displays below stock quantity field */}
        <div className="mt-2">
          <StockPreviewBox
            items={items}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
      
      {/* ... other form fields ... */}
    </div>
  );
}
```

## Display Format

Each preview box shows:
```
-{quantity} · {customerName} · {orderNumber} · status: {status}
```

Example:
```
-2 · Ram Sharma · ORDER-1024 · status: processing
-1 · Sita Devi · ORDER-1025 · status: confirmed
```

## Key Behaviors

### ✅ Separate Boxes (No Merging)
- Each order item gets its own preview box
- Quantities are NOT merged even for the same customer
- Example: If Ram Sharma has 2 orders, show 2 separate boxes

### ✅ Read-Only Display
- No stock mutation logic
- No editable fields
- No mutation RPCs called
- Purely informational preview

### ✅ Loading State
Shows spinner with "Loading pending stock impact..." text

### ✅ Error State
Shows amber warning box with error message

### ✅ Empty State
Renders `null` (nothing displayed) when no pending stock impact exists

## Styling Conventions

- **Color Scheme**: Amber/orange for "pending action" appearance
  - Border: `border-amber-200`
  - Background: `bg-amber-50`
  - Text: `text-amber-900`, `text-amber-700`
  
- **Component Classes**: Following existing admin patterns
  - Small text: `text-xs`, `text-sm`
  - Spacing: `space-y-2`, `px-3 py-2`
  - Rounded corners: `rounded-lg`

## Security & Architecture Notes

### ❌ DO NOT
- Import `stock-impact.ts` directly into client components
- Import `"server-only"` modules into client code
- Expose service-role Supabase credentials to browser
- Create new database indexes
- Modify database schema
- Call stock mutation RPCs
- Mutate `products.stock_quantity`

### ✅ DO
- Use `getStockImpactPreviewAction` server action
- Use `useStockImpactPreview` hook in client components
- Pass `productId` as prop from parent
- Handle null/undefined `productId` gracefully
- Use existing indexes (idx_orders_status, idx_order_items_order_id)

## Requirements Satisfied

- **Requirement 1.2**: Display format `-{quantity} · {customerName} · {orderNumber} · status: {status}`
- **Requirement 1.3**: Separate boxes for multiple customers (no merging)
- **Requirement 1.5**: No mutation of `products.stock_quantity`
- **Requirement 2.2**: Same preview box component usable across admin views
- **Requirement 2.3**: Separate boxes in all contexts

## Next Steps (NOT in Task 10)

Task 10 creates ONLY the standalone component and hook. Integration happens in later tasks:

- **Task 11**: Integrate into admin product form
- **Task 12**: Integrate into HisabKitab inventory table

DO NOT modify `product-form.tsx` or HisabKitab files in Task 10.
