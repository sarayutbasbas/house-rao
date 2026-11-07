"use client";
import { notifyShoppingChanged } from '@/lib/use-shopping-count';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck, Pencil, ShoppingBasket } from "lucide-react";
import type { ShoppingItem } from "@/lib/shopping";
import { itemAddress } from "@/lib/types";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { BottomSheet } from "./bottom-sheet";
import { DatePicker } from "./date-picker";
import { CategoryIcon } from "./category-icon";
import { normalizeIntegerInput, parseIntegerInput } from "@/lib/number-input";
export function ShoppingList({
  houseId,
  initialItems,
}: {
  houseId: string;
  initialItems: ShoppingItem[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [confirm, setConfirm] = useState(false);
  const requestId = useRef<string | null>(null);
  useEffect(() => setList(initialItems), [initialItems]);
  async function refresh() {
    const response = await fetch(`/api/houses/${houseId}/shopping`, {
      cache: "no-store",
    });
    if (response.ok) setList(await response.json());
    router.refresh();
  }
  useEffect(() => {
    const update = () => {
      if (
        document.visibilityState === "visible" &&
        !lock.current &&
        !editing &&
        !confirm
      )
        void refresh().catch(() => {});
    };
    window.addEventListener("focus", update);
    const interval = setInterval(update, 30000);
    return () => {
      window.removeEventListener("focus", update);
      clearInterval(interval);
    };
  }, [houseId, editing, confirm]);
  async function update(
    item: ShoppingItem,
    patch: Partial<ShoppingItem["shopping"]>,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const shopping = { ...item.shopping, ...patch };
      const response = await fetch(`/api/houses/${houseId}/shopping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, ...shopping }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setList((old) =>
        old.map((row) => (row.id === item.id ? { ...row, shopping } : row)),
      );
      requestId.current = null;
      setEditing(null);
      notifyShoppingChanged(); toast.success(
        patch.checked === undefined
          ? "บันทึกรายการแล้ว"
          : shopping.checked
            ? "หยิบแล้ว"
            : "ยกเลิกการติ๊กแล้ว",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const selected = list.filter((item) => item.shopping.checked);
  async function complete() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/houses/${houseId}/shopping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId.current,
          entries: selected.map((item) => ({
            itemId: item.id,
            quantity: item.shopping.quantity,
            expiryDate: item.shopping.expiryDate,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      requestId.current = null;
      setConfirm(false);
      notifyShoppingChanged(); toast.success(`เติมสต็อกแล้ว ${data.count} รายการ`);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "เติมสต็อกไม่สำเร็จ",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">ต้องซื้อ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          หยิบแล้ว {selected.length}/{list.length} รายการ
        </p>
      </header>
      <Button
        className="w-full shopping-complete"
        disabled={busy || !selected.length}
        onClick={() => setConfirm(true)}
      >
        <CheckCheck size={20} />
        เติมที่เลือก ({selected.length})
      </Button>
      <p className="text-xs text-muted-foreground">
        แตะดินสอเพื่อแก้รายการ
      </p>
      <div className="space-y-2">
        {list.map((item) => (
          <article
            key={item.id}
            className="shopping-row"
            data-checked={item.shopping.checked}
          >
            <div className="shopping-thumb">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" loading="lazy" />
              ) : (
                <CategoryIcon
                  value={item.category?.emoji}
                  name={item.category?.name}
                />
              )}
            </div>
            <Checkbox
              disabled={busy || item.shopping.quantity < 1}
              checked={item.shopping.checked}
              onCheckedChange={(checked) =>
                void update(item, { checked: checked === true })
              }
              aria-label={`หยิบ ${item.name}`}
            />
            <div className="min-w-0 flex-1">
              <strong className="shopping-name block truncate" title={item.name}>
                {item.name}
              </strong>
              <p
                className="text-xs text-muted-foreground truncate"
                title={itemAddress(item)}
              >
                {itemAddress(item)}
              </p>
              <p className="mt-1 text-sm">
                ซื้อ {item.shopping.quantity} {item.unit}{" "}
                <span className="text-xs text-muted-foreground">
                  · เหลือ {item.quantity}
                </span>
              </p>
              {item.shopping.expiryDate && (
                <p className="text-xs text-muted-foreground">
                  หมดอายุ {item.shopping.expiryDate}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              aria-label={`แก้จำนวนซื้อ ${item.name}`}
              onClick={() => {
                setEditing(item);
                setQuantity(String(item.shopping.quantity));
                setExpiry(item.shopping.expiryDate ?? "");
              }}
            >
              <Pencil size={18} />
            </Button>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state rounded-3xl bg-card p-8 text-center">
          <ShoppingBasket className="mx-auto mb-3 text-primary" />
          <p>ไม่มีของต้องซื้อ</p>
        </div>
      )}
      {editing && (
        <BottomSheet
          title={`ซื้อ ${editing.name}`}
          subtitle="เว้นวันหมดอายุได้"
          busy={busy}
          onClose={() => setEditing(null)}
          submitLabel="บันทึก"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await update(editing, {
                quantity: parseIntegerInput(quantity, 1),
                expiryDate: expiry || null,
              });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "จำนวนไม่ถูกต้อง");
            }
          }}
        >
          <Label htmlFor="shopping-quantity">
            จำนวนที่ซื้อ ({editing.unit})
          </Label>
          <Input
            id="shopping-quantity"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={999999}
            value={quantity}
            onChange={(e) => setQuantity(normalizeIntegerInput(e.target.value))}
          />
          <Label htmlFor="shopping-expiry">วันหมดอายุ</Label>
          <DatePicker
            id="shopping-expiry"
            value={expiry}
            onChange={setExpiry}
          />
        </BottomSheet>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(value) => {
          if (!busy) setConfirm(value);
        }}
      >
        <DialogContent className="member-confirm-dialog" role="alertdialog"
          showCloseButton={false}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>เติมสต็อก?</DialogTitle>
            <DialogDescription>
              เฉพาะ {selected.length} รายการที่เลือก
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              ยกเลิก
            </Button>
            <Button disabled={busy} onClick={() => void complete()}>
              {busy ? "กำลังเติมสต็อก…" : "เติมสต็อก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
