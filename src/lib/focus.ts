import type { TimerEvent } from './types';

/**
 * Computes the actual *active* focus duration (in whole minutes) from a
 * session's timer events, excluding any time spent paused.
 *
 * Active time accrues between a 'start'/'resume' and the next 'pause'/'stop'.
 * This replaces the previous (stopTime - startTime) calculation, which counted
 * paused time as focused time and inflated focus minutes, XP, and analytics.
 *
 * If the session is still running (no terminating 'pause'/'stop') and a
 * fallbackEndTime is given, the final open interval is closed at that time.
 */
export function computeActiveDurationMinutes(events?: TimerEvent[], fallbackEndTime?: string): number {
    if (!events || events.length === 0) return 0;

    const sorted = [...events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let activeMs = 0;
    let runningSince: number | null = null;

    for (const event of sorted) {
        const t = new Date(event.timestamp).getTime();
        if (Number.isNaN(t)) continue;

        if (event.type === 'start' || event.type === 'resume') {
            if (runningSince === null) runningSince = t;
        } else if (event.type === 'pause' || event.type === 'stop') {
            if (runningSince !== null) {
                activeMs += Math.max(0, t - runningSince);
                runningSince = null;
            }
        }
    }

    // Still running with no terminating event — close it at the fallback time.
    if (runningSince !== null && fallbackEndTime) {
        const end = new Date(fallbackEndTime).getTime();
        if (!Number.isNaN(end)) activeMs += Math.max(0, end - runningSince);
    }

    return Math.floor(activeMs / 60000);
}
