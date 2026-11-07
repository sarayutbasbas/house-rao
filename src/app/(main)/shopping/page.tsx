import { activeHouse } from "@/lib/access";
import { redirect } from "next/navigation";
import { shoppingList } from "@/lib/shopping";
import { ShoppingList } from "@/components/shopping-list";
export default async function ShoppingPage() {
  const selected = await activeHouse();
  if (!selected) redirect("/");
  return (
    <ShoppingList
      houseId={selected.house.id}
      initialItems={await shoppingList(selected.house.id)}
    />
  );
}
