import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <div aria-label="กำลังโหลดหน้า" className="space-y-5">
    <Skeleton className="h-9 w-48 rounded-xl" />
    <Skeleton className="h-5 w-64 rounded-lg" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    <Skeleton className="h-56 rounded-2xl" />
  </div>;
}
