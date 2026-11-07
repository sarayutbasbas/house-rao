import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <div className="space-y-6" role="status" aria-label="กำลังโหลดหน้า">
    <div className="space-y-3"><Skeleton className="h-8 w-44" /><Skeleton className="h-4 w-72 max-w-full" /></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    <Skeleton className="h-56 rounded-2xl" />
  </div>;
}
