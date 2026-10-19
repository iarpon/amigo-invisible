import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <DashboardClient user={user} />
      </main>
    </div>
  );
}
