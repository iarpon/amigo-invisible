import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import GroupWorkspaceClient from './GroupWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">
        <GroupWorkspaceClient groupId={id} user={user} />
      </main>
    </div>
  );
}
