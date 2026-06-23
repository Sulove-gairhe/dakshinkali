export function sanitizeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

export function getHisabKitabUrl() {
  return (
    process.env.NEXT_PUBLIC_HISABKITAB_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3002"
      : "https://hisabkitab.dakshinkali.shop")
  );
}
