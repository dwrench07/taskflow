"use client";

import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import React, { useEffect, useState } from 'react';
import { AuthProvider } from "@/context/AuthContext";
import { ReminderManager } from '@/components/reminder-manager';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

export function RootClientLayout({
  children,
  fontVariable,
}: {
  children: React.ReactNode;
  fontVariable: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <body className={`${fontVariable} min-h-screen bg-background font-sans antialiased`}>
      {isMounted ? (
        <AuthProvider>
          <AppLayout>
            <React.Suspense fallback={<div>Loading...</div>}>
              {children}
            </React.Suspense>
          </AppLayout>
          <ReminderManager />
          <PwaInstallPrompt />
        </AuthProvider>
      ) : null}
      <Toaster />
    </body>
  );
}
