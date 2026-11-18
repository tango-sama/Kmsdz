import type { Locale } from "./config";
import { ar, type Dict } from "./ar";
import { fr } from "./fr";

const dictionaries: Record<Locale, Dict> = { ar, fr };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

export type { Dict };
