import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Adapted from bn-trip's TripSectionEmpty, using HouseRao's shadcn primitive.
export function EmptyState({ icon, title, description, action, onClick }: {
  icon: ReactNode; title: ReactNode; description: ReactNode; action?: string; onClick?: () => void;
}) {
  return <section className="empty-state"><span className="empty-icon" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p>{action && <Button onClick={onClick}><Plus size={16}/>{action}</Button>}</section>;
}
