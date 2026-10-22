"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefresh } from '@/context/RefreshContext';

/**
 * Handles "Hey Google, add a reminder in Dash …" App Actions.
 *
 * The Android App Action (see android/app/src/main/res/xml/shortcuts.xml) opens
 * the app via a deep link of the form:  dash://quick-add?text=<spoken text>
 * We catch it here (both cold-start and while-running), send the text to the
 * quick-add endpoint, and confirm with a toast.
 */
async function submitQuickAdd(text: string): Promise<{ ok: boolean; title?: string; error?: string }> {
  try {
    const res = await fetch('/api/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        now: Date.now(),
        tzOffsetMinutes: new Date().getTimezoneOffset(),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.error || `Request failed (${res.status})` };
    }
    const data = await res.json();
    return { ok: true, title: data?.task?.title };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

function extractReminderText(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const isQuickAdd = url.host === 'quick-add' || url.pathname.replace(/\//g, '') === 'quick-add';
    if (!isQuickAdd) return null;
    const text = url.searchParams.get('text') || url.searchParams.get('q');
    return text && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

export function DeepLinkHandler() {
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let handled = false;

    const handle = async (rawUrl?: string) => {
      if (!rawUrl || handled) return;
      const text = extractReminderText(rawUrl);
      if (!text) return;
      handled = true; // guard against the same launch URL firing twice
      const result = await submitQuickAdd(text);
      if (result.ok) {
        toast({ title: 'Reminder added', description: result.title });
        triggerRefresh();
      } else {
        toast({ title: "Couldn't add reminder", description: result.error, variant: 'destructive' });
      }
      // Allow a subsequent voice command in the same session.
      setTimeout(() => { handled = false; }, 1500);
    };

    const setup = async () => {
      try {
        const { App } = await import('@capacitor/app');
        // Cold start: the app was launched by the deep link.
        const launch = await App.getLaunchUrl();
        if (launch?.url) handle(launch.url);
        // Warm: the app was already open.
        const listener = await App.addListener('appUrlOpen', (event) => handle(event.url));
        cleanup = () => listener.remove();
      } catch {
        // Not running under Capacitor (plain browser) — nothing to listen for.
      }
    };

    setup();
    return () => cleanup?.();
  }, [toast, triggerRefresh]);

  return null;
}
