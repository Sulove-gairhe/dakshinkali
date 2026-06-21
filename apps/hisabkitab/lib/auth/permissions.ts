export const HISABKITAB_PERMISSIONS = {
  settings: {
    view: "hisabkitab.settings.view",
    edit: "hisabkitab.settings.edit",
  },
  inventory: {
    view: "hisabkitab.inventory.view",
  },
  stockMovements: {
    view: "hisabkitab.stock_movements.view",
  },
  suppliers: {
    view: "hisabkitab.suppliers.view",
  },
  purchases: {
    view: "hisabkitab.purchases.view",
  },
  payments: {
    view: "hisabkitab.payments.view",
  },
  accounts: {
    view: "hisabkitab.accounts.view",
  },
  ledger: {
    view: "hisabkitab.ledger.view",
  },
  reports: {
    view: "hisabkitab.reports.view",
  },
  auditLogs: {
    view: "hisabkitab.audit_logs.view",
  },
  accounting: {
    view: "hisabkitab.accounting.view",
  },
} as const;

export type HisabKitabPermission = string;

export type HisabKitabRole = "admin" | "staff";

export type HisabKitabUserContext = {
  userId: string;
  email: string | null;
  role: HisabKitabRole;
  fullName: string | null;
  staffPermissions: string[];
  isAdmin: boolean;
};

function collectPermissionStrings(value: unknown, prefix = ""): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      typeof entry === "string" ? [entry] : collectPermissionStrings(entry),
    );
  }

  if (typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof entry === "string") {
        return [entry];
      }

      if (entry === true && path.startsWith("hisabkitab.")) {
        return [path];
      }

      return collectPermissionStrings(entry, path);
    },
  );
}

export function parseStaffPermissions(value: unknown): string[] {
  return Array.from(new Set(collectPermissionStrings(value))).filter(
    (permission) => permission.startsWith("hisabkitab."),
  );
}

export function hasPermission(
  context: Pick<HisabKitabUserContext, "isAdmin" | "staffPermissions">,
  permission: string,
) {
  return context.isAdmin || context.staffPermissions.includes(permission);
}

export function hasAnyHisabKitabPermission(
  context: Pick<HisabKitabUserContext, "isAdmin" | "staffPermissions">,
) {
  return context.isAdmin || context.staffPermissions.length > 0;
}
