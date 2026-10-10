import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Chore } from './types';

type ChoreScheduleFields = Pick<Chore, 'frequency' | 'intervalDays' | 'lastCompleted' | 'completedOnce'>;

/**
 * Recurrence interval, in days, for a chore's frequency.
 * Returns null for non-recurring ('once') chores.
 *
 * Note: there is no 'monthly' ChoreFrequency — monthly/quarterly/yearly chores
 * are modelled as 'custom' with an explicit `intervalDays` (30/90/365). The
 * default interval for a 'custom' chore with no interval set is 30 days.
 */
export function choreIntervalDays(chore: Pick<Chore, 'frequency' | 'intervalDays'>): number | null {
  switch (chore.frequency) {
    case 'once':
      return null;
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'custom':
    default:
      return chore.intervalDays ?? 30;
  }
}

/**
 * Whether a chore is due to be done on `now` (defaults to today).
 *
 * - 'once' chores are due only until they have been completed once.
 * - Recurring chores are due when at least their interval has elapsed since the
 *   last completion (or when they have never been completed).
 *
 * This is the single source of truth for "is this chore due" so the dashboard,
 * the morning launch view, and the chores page stay consistent.
 */
export function isChoreDue(chore: ChoreScheduleFields, now: Date = new Date()): boolean {
  if (chore.frequency === 'once') {
    return !chore.completedOnce && !chore.lastCompleted;
  }
  if (!chore.lastCompleted) return true;
  const interval = choreIntervalDays(chore) ?? 1;
  return differenceInCalendarDays(now, parseISO(chore.lastCompleted)) >= interval;
}
