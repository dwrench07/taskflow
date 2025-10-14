
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
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
  const { completionHistory, habitFrequency = 'daily' } = habit;
  if (!completionHistory || completionHistory.length === 0) {
    return 0;
  }

  const completionDates = completionHistory.map(d => startOfDay(parseISO(d)));
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
  
  const { isCurrent, diff, sub } = checkFunctions[habitFrequency];

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
