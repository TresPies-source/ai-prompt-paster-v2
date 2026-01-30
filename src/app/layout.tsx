import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import AIProvider from "@/components/ai/AIProvider";
import Navigation from "@/components/common/Navigation";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI Prompt Paster",
  description: "Organize and manage your AI prompts with intelligent tagging and semantic search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <AIProvider autoInitialize={false}>
              <Navigation />
              {children}
            </AIProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
