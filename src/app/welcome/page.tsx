import { activeHouse } from '@/lib/access';
import { auth } from '@/auth'; import { redirect } from 'next/navigation'; import { Suspense } from 'react'; import { HouseSetup } from '@/components/house-setup';
export default async function Welcome(){if(!await auth())redirect('/login');const selected = await activeHouse();return <main className="auth-screen min-h-dvh flex items-center justify-center p-5"><Suspense><HouseSetup canClose={!!selected}/></Suspense></main>}
