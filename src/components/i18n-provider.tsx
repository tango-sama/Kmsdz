"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n";

export type ClientDict = Pick<Dict, "common" | "nav" | "quote" | "validation" | "apiErrors" | "contact" | "confirmation" | "notFound">;
type Ctx = { locale: Locale; dict: ClientDict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: ClientDict; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
