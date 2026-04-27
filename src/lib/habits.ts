
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  isToday,
  isYesterday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { Task } from './types';

export function calculateStreak(habit: Task): number {
  const { completionHistory } = habit;
  // Map the unified recurrence to the streak window. Anything not weekly/monthly is treated as daily.
  const frequency: 'daily' | 'weekly' | 'monthly' =
    habit.recurrence === 'weekly' ? 'weekly'
    : habit.recurrence === 'monthly' ? 'monthly'
    : 'daily';
  if (!completionHistory || completionHistory.length === 0) {
    return 0;
  }

  // Normalize to date-only string first to avoid UTC→local timezone shift across devices
  const toDateStr = (d: string) => d.length === 10 ? d : d.substring(0, 10);
  const completionDates = completionHistory.map(d => startOfDay(parseISO(toDateStr(d))));
  const uniqueDates = Array.from(new Set(completionDates.map(d => d.getTime()))).map(t => new Date(t));
  uniqueDates.sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDates.length === 0) return 0;
  
  let streak = 0;
  let today = startOfDay(new Date());
  let lastCompletion = uniqueDates[0];
  
  const checkFunctions = {
    daily: {
      isCurrent: (date: Date) => isToday(date) || isYesterday(date),
      diff: (d1: Date, d2: Date) => differenceInCalendarDays(d1, d2),
      sub: (date: Date, num: number) => subDays(date, num),
    },
    weekly: {
      isCurrent: (date: Date) => isWithinInterval(date, {start: startOfWeek(subDays(today, 7)), end: endOfWeek(today)}),
      diff: (d1: Date, d2: Date) => differenceInCalendarWeeks(d1, d2, { weekStartsOn: 1 }),
      sub: (date: Date, num: number) => startOfWeek(subDays(date, num * 7), { weekStartsOn: 1 }),
    },
    monthly: {
      isCurrent: (date: Date) => isWithinInterval(date, {start: startOfMonth(subDays(today, 30)), end: endOfMonth(today)}),
      diff: (d1: Date, d2: Date) => differenceInCalendarMonths(d1, d2),
      sub: (date: Date, num: number) => startOfMonth(subDays(date, num * 30)),
    }
  }
  
  const { isCurrent, diff, sub } = checkFunctions[frequency];

  if (!isCurrent(lastCompletion)) {
    return 0;
  }

  streak = 1;
  let expectedDate = sub(lastCompletion, 1);
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentCompletion = uniqueDates[i];
    
    if (diff(expectedDate, currentCompletion) > 0) {
        break; // Gap in streak
    }

    if (diff(lastCompletion, currentCompletion) > 1) {
        streak++;
        lastCompletion = currentCompletion;
        expectedDate = sub(lastCompletion, 1);
    } else if (diff(lastCompletion, currentCompletion) === 1) {
        streak++;
        lastCompletion = currentCompletion;
        expectedDate = sub(lastCompletion, 1);
    }
    // If diff is 0, it means multiple completions in the same period, so we just continue
  }
  
  return streak;
}

export function getStreakTier(streak: number): { name: string; color: string } {
  if (streak >= 180) return { name: 'Mastered', color: 'text-amber-400' };
  if (streak >= 66) return { name: 'Established', color: 'text-purple-400' };
  if (streak >= 21) return { name: 'Growing', color: 'text-blue-400' };
  if (streak >= 7) return { name: 'Rooted', color: 'text-green-400' };
  if (streak >= 1) return { name: 'Seedling', color: 'text-emerald-400' };
  return { name: '', color: '' };
}

export function getFrogDecayLevel(task: Task): 'fresh' | 'aging' | 'rotting' {
  const ref = task.doDate || task.startDate;
  if (!ref) return 'fresh';
  const age = differenceInDays(startOfDay(new Date()), startOfDay(parseISO(ref)));
  if (age >= 7) return 'rotting';
  if (age >= 3) return 'aging';
  return 'fresh';
}

export function isHabitAtRisk(habit: Task): boolean {
  const hour = new Date().getHours();
  if (hour < 18) return false; // Only after 6 PM
  const todayStr = new Date().toISOString().substring(0, 10);
  const toDateStr = (d: string) => d.length === 10 ? d : d.substring(0, 10);
  const doneToday = habit.completionHistory?.some(d => toDateStr(d) === todayStr) ?? false;
  return !doneToday && calculateStreak(habit) > 0; // Only at-risk if there's a streak to lose
}
