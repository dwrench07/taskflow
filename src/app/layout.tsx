"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/toaster';
import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Ensure the component is mounted before rendering
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sessionToken="))
      ?.split("=")[1];

    // Allow access to the login page without authentication
    if (!sessionToken && pathname !== "/login") {
      router.push("/login");
    }
  }, [router, pathname]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        {isMounted ? (
          <AuthProvider>
            <AppLayout>
              <React.Suspense fallback={<div>Loading...</div>}>
                {children}
              </React.Suspense>
            </AppLayout>
          </AuthProvider>
        ) : null}
        <Toaster />
      </body>
    </html>
  );
}
