"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Laptop, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      // Show our custom prompt after a short delay
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    setIsVisible(false);
    installPrompt.prompt();
    
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500 md:bottom-8 md:right-8 md:left-auto md:w-96">
      <Card className="border-border p-5 shadow-2xl relative overflow-hidden bg-card">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-white/10"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Download className="h-6 w-6 text-primary-foreground" />
          </div>
          
          <div className="space-y-1 pr-6">
            <h3 className="font-bold tracking-tight text-lg">Install Dash</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Install Dash on your device for a faster, offline-ready experience with native notifications.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button 
            className="flex-1 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleInstallClick}
          >
            Install Now
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl font-medium border-white/10 hover:bg-white/5"
            onClick={handleDismiss}
          >
            Later
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
           <div className="flex items-center gap-1.5"><Laptop className="h-3 w-3" /> Desktop</div>
           <div className="h-1 w-1 rounded-full bg-muted-foreground" />
           <div className="flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> Mobile</div>
        </div>
      </Card>
    </div>
  );
}
