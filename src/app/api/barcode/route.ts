import { houseUser, unauthorized } from "@/lib/access";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
export async function GET(request: Request) {
  const url = new URL(request.url),
    houseId = url.searchParams.get("houseId"),
    code = url.searchParams.get("code");
  if (
    !houseId ||
    !z.uuid().safeParse(houseId).success ||
    !(await houseUser(houseId))
  )
    return unauthorized();
  if (!code || !/^\d{8,14}$/.test(code))
    return Response.json(
      { error: "รหัสสินค้าต้องเป็นตัวเลข 8–14 หลัก" },
      { status: 400 },
    );
  const [known] = await db()
    .select()
    .from(items)
    .where(and(eq(items.houseId, houseId), eq(items.barcode, code)))
    .orderBy(desc(items.updatedAt))
    .limit(1);
  if (known)
    return Response.json({
      code,
      name: known.name,
      brand: known.brand ?? undefined,
      size: known.size ?? undefined,
      unit: known.unit,
      source: "house",
    });
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name_th,product_name,brands,quantity`,
      {
        headers: {
          "User-Agent": "HouseRao/1.0 (https://house-rao.basnana.com)",
        },
        signal: AbortSignal.timeout(7000),
        next: { revalidate: 86400 },
      },
    );
    if (response.status === 404) return Response.json({ code, source: "none" });
    if (!response.ok) throw new Error("Lookup unavailable");
    const body = await response.json();
    const p = body.product;
    const clean = (value: unknown, max: number) =>
      typeof value === "string"
        ? value.trim().slice(0, max) || undefined
        : undefined;
    if (body.status !== 1 || !p) return Response.json({ code, source: "none" });
    return Response.json({
      code,
      name: clean(p.product_name_th, 120) ?? clean(p.product_name, 120),
      brand: clean(p.brands, 100),
      size: clean(p.quantity, 100),
      source: "openfoodfacts",
      sourceUrl: `https://world.openfoodfacts.org/product/${code}`,
    });
  } catch {
    return Response.json(
      {
        error: "บริการค้นหายังไม่พร้อม กรอกข้อมูลเองได้ หรือค้นหาใหม่อีกครั้ง",
      },
      { status: 503 },
    );
  }
}
