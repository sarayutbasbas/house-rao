import { Apple, Baby, Battery, BedDouble, BookOpen, BriefcaseMedical, Camera, CircleHelp, Coffee, Fish, Gift, Heart, House, Laptop, Leaf, Lightbulb, Milk, Package, PawPrint, Plug, Scissors, Shirt, ShoppingBag, ShowerHead, Snowflake, Sparkles, SprayCan, Refrigerator, ScrollText, Utensils, Wrench } from 'lucide-react';
import { categoryIconKey, type CategoryIconKey } from '@/lib/category-icons';

const icons = { package: Package, food: Utensils, apple: Apple, fish: Fish, coffee: Coffee, bottle: Milk, fridge: Refrigerator, snow: Snowflake, spray: SprayCan, sparkles: Sparkles, shower: ShowerHead, scissors: Scissors, shirt: Shirt, bed: BedDouble, medical: BriefcaseMedical, heart: Heart, baby: Baby, pet: PawPrint, battery: Battery, plug: Plug, bulb: Lightbulb, tools: Wrench, laptop: Laptop, camera: Camera, book: BookOpen, paper: ScrollText, shopping: ShoppingBag, house: House, leaf: Leaf, gift: Gift, help: CircleHelp } satisfies Record<CategoryIconKey, typeof Package>;
export function CategoryIcon({ value, name, size = 24 }: { value?: string | null; name?: string; size?: number }) {
  const Icon = icons[categoryIconKey(value, name)];
  return <Icon size={size} aria-hidden="true" className="shrink-0" />;
}
