import { CategoryIcon } from './category-icon';
import { ItemDetailLink } from './item-sheet-provider';
import { EmptyState } from './empty-state';
import { PageIntro } from './page-intro';
import { db } from '@/db';
import { categories, items } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export async function HistoryContent({ houseId }: { houseId: string }) {
  const rows = await db().select({
    item: { id: items.id, name: items.name, imageUrl: items.imageUrl, brand: items.brand, size: items.size, variant: items.variant },
    category: { name: categories.name, emoji: categories.emoji },
  }).from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.houseId, houseId), eq(items.archived, true))).orderBy(desc(items.updatedAt));
  return <div className="fade-in">
    <PageIntro title="ประวัติของในบ้าน" subtitle="สินค้าที่ใช้หมด" />
    {rows.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(({ item, category }) => <ItemDetailLink href={`/${houseId}/items/${item.id}`} prefetch key={item.id}><Card className="h-full transition-colors hover:ring-primary/50"><CardContent className="flex gap-4"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted text-3xl">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="size-full object-cover" /> : <CategoryIcon value={category?.emoji} name={category?.name} size={28}/>}</div><div className="min-w-0"><h2 className="line-clamp-2 font-bold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{category?.name ?? 'ไม่ระบุหมวดหมู่'}</p><p className="mt-2 line-clamp-1 text-xs text-primary">{[item.brand, item.size, item.variant].filter(Boolean).join(' · ') || 'ดูรายละเอียด'}</p></div></CardContent></Card></ItemDetailLink>)}</div> : <div className="mt-7"><EmptyState icon={<History size={30}/>} title="ยังไม่มีประวัติ" description="สินค้าที่ใช้หมดจะแสดงที่นี่" /></div>}

  </div>;
}
