import {
  BarChart3,
  Boxes,
  ClipboardList,
  Landmark,
  ReceiptText,
  Truck,
  WalletCards,
} from "lucide-react";
import { PlaceholderCard } from "./PlaceholderCard";
import { PageHeader } from "@/components/shared/PageHeader";

const modules = [
  { title: "Inventory", phase: "Phase 2", icon: Boxes },
  { title: "Stock Movements", phase: "Phase 2", icon: ReceiptText },
  { title: "Suppliers", phase: "Phase 3", icon: Truck },
  { title: "Purchases", phase: "Phase 3", icon: ClipboardList },
  { title: "Payments", phase: "Phase 4", icon: WalletCards },
  { title: "Reports", phase: "Phase 4", icon: BarChart3 },
  { title: "Accounts and Ledger", phase: "Phase 4", icon: Landmark },
];

export function DashboardShell() {
  return (
    <div>
      <PageHeader
        eyebrow="Phase 1"
        title="HisabKitab workspace"
        description="This first phase establishes the protected shell, settings, preferences, and Privacy Mode. Future business modules are visible as placeholders only."
      />

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 font-semibold text-slate-950">Phase 1 active</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Live module</p>
            <p className="mt-1 font-semibold text-slate-950">Settings</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Data calls</p>
            <p className="mt-1 font-semibold text-slate-950">No future module queries</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <PlaceholderCard key={module.title} {...module} />
        ))}
      </section>
    </div>
  );
}
