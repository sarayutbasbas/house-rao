import { roomSummaries } from "@/lib/room-data";
import { RoomBoard } from "./room-board";
import Link from "next/link";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { CalendarClock, ShoppingBasket, Package } from "lucide-react";
import { expiryState } from "@/lib/types";

export async function HomeContent({ houseId }: { houseId: string }) {
  const [roomList, all] = await Promise.all([
    roomSummaries(houseId),
    db()
      .select({
        quantity: items.quantity,
        minimum: items.minimum,
        expiryDate: items.expiryDate,
      })
      .from(items)
      .where(and(eq(items.houseId, houseId), eq(items.archived, false))),
  ]);
  const low = all.filter((item) => item.quantity <= item.minimum).length;
  const expired = all.filter(
    (item) => item.quantity > 0 && expiryState(item.expiryDate) === "expired",
  ).length;
  return (
    <div className="fade-in space-y-6">
      <div className="home-quick-stats" aria-label="สรุปสินค้าในบ้าน">
        <Link href="/shopping" replace className="tone-butter">
          <ShoppingBasket />
          <span>
            <strong>{low}</strong>
            <small>ควรเติม</small>
          </span>
        </Link>
        <Link href="/inventory?status=expired" replace className="tone-blush">
          <CalendarClock />
          <span>
            <strong>{expired}</strong>
            <small>หมดอายุ</small>
          </span>
        </Link>
        <Link href="/inventory" replace className="tone-lilac">
          <Package />
          <span>
            <strong>{all.length}</strong>
            <small>สินค้าทั้งหมด</small>
          </span>
        </Link>
      </div>
      <RoomBoard houseId={houseId} initialRooms={roomList} />
    </div>
  );
}
