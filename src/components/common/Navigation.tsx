'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoutButton from '@/components/auth/LogoutButton';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session || pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              AI Prompt Paster
            </button>
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => router.push('/paster')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  pathname === '/paster'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                New Prompt
              </button>
              <button
                onClick={() => router.push('/library')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  pathname === '/library'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Library
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-gray-600">
              {session.user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>

        <div className="md:hidden flex gap-2 mt-3">
          <button
            onClick={() => router.push('/paster')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              pathname === '/paster'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            New Prompt
          </button>
          <button
            onClick={() => router.push('/library')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              pathname === '/library'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Library
          </button>
        </div>
      </div>
    </nav>
  );
}
