/** Algerian phone number helpers. Accepts local (0661...) and international (+213 661... / 00213...) formats. */

export function normalizePhone(input: string): string {
  let v = (input || "").replace(/[\s.\-()‎‏]/g, "");
  // Arabic-Indic digits -> Latin
  v = v.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  v = v.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  if (v.startsWith("+213")) v = "0" + v.slice(4);
  else if (v.startsWith("00213")) v = "0" + v.slice(5);
  else if (v.startsWith("213") && v.length === 12) v = "0" + v.slice(3);
  // tolerate the common "+213 (0)661..." writing
  if (v.startsWith("00") && v.length === 11) v = v.slice(1);
  return v;
}

const MOBILE = /^0[567]\d{8}$/; // 05 / 06 / 07 + 8 digits
const LANDLINE = /^0[234]\d{7}$/; // 0 + 2-digit area code + 6 digits

export function isValidAlgerianPhone(input: string): boolean {
  const n = normalizePhone(input);
  return MOBILE.test(n) || LANDLINE.test(n);
}

/** 0661204590 -> "0661 20 45 90" */
export function formatPhone(input: string): string {
  const n = normalizePhone(input);
  if (MOBILE.test(n)) return `${n.slice(0, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
  if (LANDLINE.test(n)) return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
  return input;
}
