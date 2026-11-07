/** Accept product identifiers, never navigate to a scanned QR URL. */
export function productCode(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{8,14}$/.test(value)) return value;
  const gs1 = value.match(/^\(01\)(\d{14})(?:\(|$)/);
  if (gs1) return gs1[1];
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.pathname.match(/(?:^|\/)01\/(\d{14})(?:\/|$)/)?.[1] ?? null;
  } catch {
    return null;
  }
}
export type BarcodeProduct = {
  code: string;
  name?: string;
  brand?: string;
  size?: string;
  unit?: string;
  source: "house" | "openfoodfacts" | "none";
  sourceUrl?: string;
};
