'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LibraryLayout from '@/components/library/LibraryLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function LibraryPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <LibraryLayout />
    </div>
  );
}
