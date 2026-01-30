"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/auth/LoginButton";
import LogoutButton from "@/components/auth/LogoutButton";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          AI Prompt Paster
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Organize and manage your AI prompts with intelligent tagging and
          semantic search
        </p>

        <div className="pt-8">
          {session ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-800 dark:text-gray-200">
                Welcome, {session.user?.name || session.user?.email}!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/paster')}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-blue-500"
                >
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    New Prompt
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paste and organize a new AI prompt with intelligent suggestions
                  </p>
                </button>

                <button
                  onClick={() => router.push('/library')}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-indigo-500"
                >
                  <div className="text-4xl mb-3">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Library
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse, search, and manage your prompt collection
                  </p>
                </button>
              </div>

              <div className="pt-4">
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Sign in to get started
              </p>
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
