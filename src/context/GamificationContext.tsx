"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Task, FocusSession, UserProgress } from "@/lib/types";
import { getAllTasks, getFocusSessions, getUserProgress } from "@/lib/data";
import {
  calculateTotalXP,
  calculateTodayXP,
  getLevel,
  checkBadges,
  calculateDailyWins,
  type CelebrationEvent,
  type CelebrationReason,
  type EarnedBadge,
  type DailyWins,
} from "@/lib/gamification";
import { playSound } from "@/lib/sounds";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { useAuth } from "@/context/AuthContext";

interface GamificationContextType {
  // Data
  totalXP: number;
  todayXP: number;
  level: ReturnType<typeof getLevel>;
  badges: EarnedBadge[];
  dailyWins: DailyWins;
  userProgress: UserProgress | null;

  // Actions
  celebrate: (event: CelebrationEvent) => void;
  refreshGamification: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiIntensity, setConfettiIntensity] = useState<'small' | 'medium' | 'big'>('medium');

  // Base XP calculated from tasks, then we can add bonus XP stored in UserProgress
  const baseTotalXP = calculateTotalXP(allTasks, focusSessions);
  const totalXP = baseTotalXP + (userProgress?.xp || 0);

  const todayXP = calculateTodayXP(allTasks, focusSessions);
  const level = getLevel(totalXP);
  const badges = checkBadges(allTasks, focusSessions);
  const dailyWins = calculateDailyWins(allTasks, focusSessions);

  const refreshProgress = useCallback(async () => {
    try {
      if (!user) return;
      const progress = await getUserProgress();
      setUserProgress(progress);
    } catch {
        // silent fail
    }
  }, [user]);

  const refreshGamification = useCallback(async () => {
    try {
      const [tasks, sessions] = await Promise.all([
        getAllTasks(),
        getFocusSessions(),
      ]);
      setAllTasks(tasks || []);
      setFocusSessions(sessions || []);
      await refreshProgress();
    } catch {
      // Silent fail — gamification is non-critical
    }
  }, [refreshProgress]);

  useEffect(() => {
    if (!authLoading && user) {
      refreshGamification();
    }
  }, [user, authLoading, refreshGamification]);

  const celebrate = useCallback((event: CelebrationEvent) => {
    setConfettiIntensity(event.intensity);
    setConfettiTrigger(prev => prev + 1);

    // Play appropriate sound
    switch (event.reason) {
      case 'badge-unlocked':
        playSound('achievement');
        break;
      case 'streak-milestone':
        playSound('streak');
        break;
      case 'frog-eaten':
      case 'all-daily-done':
        playSound('achievement');
        break;
      default:
        playSound('complete');
        break;
    }

    // Refresh data after celebration to pick up new state
    setTimeout(() => refreshGamification(), 500);
  }, [refreshGamification]);

  return (
    <GamificationContext.Provider
      value={{
        totalXP,
        todayXP,
        level,
        badges,
        dailyWins,
        userProgress,
        celebrate,
        refreshGamification,
        refreshProgress,
      }}
    >
      {children}
      <CelebrationOverlay trigger={confettiTrigger} intensity={confettiIntensity} />
    </GamificationContext.Provider>
  );
}
