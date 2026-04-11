"use client";

import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import React, { useEffect, useState } from 'react';
import { AuthProvider } from "@/context/AuthContext";
import { ReminderManager } from '@/components/reminder-manager';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { GamificationProvider } from '@/context/GamificationContext';
import { GroundingButton } from '@/components/grounding-button';
import { RefreshProvider, useRefresh } from '@/context/RefreshContext';

function VisibilityRefresh() {
  const { triggerRefresh } = useRefresh();
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [triggerRefresh]);
  return null;
}

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
        <RefreshProvider>
          <AuthProvider>
            <GamificationProvider>
              <VisibilityRefresh />
              <AppLayout>
                <React.Suspense fallback={<div>Loading...</div>}>
                  {children}
                </React.Suspense>
              </AppLayout>
              <ReminderManager />
              <PwaInstallPrompt />
              <GroundingButton />
            </GamificationProvider>
          </AuthProvider>
        </RefreshProvider>
      ) : null}
      <Toaster />
    </body>
  );
}
