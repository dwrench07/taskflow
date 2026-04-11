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
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      try {
        // Use Capacitor's native app state listener — reliable on all Android versions
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) triggerRefresh();
        });
        cleanup = () => handle.remove();
      } catch {
        // Not in a Capacitor context (regular browser) — fall back to web events
        const onVisible = () => {
          if (document.visibilityState === 'visible') triggerRefresh();
        };
        const onFocus = () => triggerRefresh();
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onFocus);
        cleanup = () => {
          document.removeEventListener('visibilitychange', onVisible);
          window.removeEventListener('focus', onFocus);
        };
      }
    };

    setup();
    return () => cleanup?.();
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
