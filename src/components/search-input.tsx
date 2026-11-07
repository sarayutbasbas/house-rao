import type { ComponentProps } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';

export function SearchInput({ className = '', ...props }: Omit<ComponentProps<typeof Input>, 'type'>) {
  return <div className="search-input-field">
    <Search size={18} aria-hidden="true"/>
    <Input {...props} type="search" className={className}/>
  </div>;
}
