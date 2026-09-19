import { redirect } from 'next/navigation';
import { getSession } from '@/lib/crm/auth';
import CRMsidebar from '@/components/crm/layout/CRMsidebar';
import CRMTopBar from '@/components/crm/layout/CRMTopBar';
import { Loader2 } from 'lucide-react';

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/crm/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMsidebar user={session} />
      <div className="md:pl-16">
        <CRMTopBar user={session} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
