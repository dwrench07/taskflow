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
    // visibilitychange is the standard event but unreliable in some Capacitor WebViews
    // window 'focus' fires more consistently when the app returns to foreground on Android
    const onVisible = () => {
      if (document.visibilityState === 'visible') triggerRefresh();
    };
    const onFocus = () => triggerRefresh();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
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
