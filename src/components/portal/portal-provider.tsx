"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { PortalDict } from "@/i18n/portal";

const Ctx = createContext<{ locale: Locale; t: PortalDict } | null>(null);

export function PortalProvider({ locale, t, children }: { locale: Locale; t: PortalDict; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, t }}>{children}</Ctx.Provider>;
}

export function usePortal() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePortal outside PortalProvider");
  return c;
}
