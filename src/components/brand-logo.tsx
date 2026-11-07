import Image from 'next/image';
import { cn } from '@/lib/utils';

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <span aria-hidden="true" className={cn('relative block shrink-0', className)}>
    <Image src="/house-rao-logo-plum.png" alt="" fill sizes="128px" priority={priority} className="object-contain" />
  </span>;
}
