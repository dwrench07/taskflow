# Exact-Time Reminders

## Problem

Today's `ReminderManager` (`src/components/reminder-manager.tsx`) is a polling loop:

- Runs `setInterval(checkRemindersAndTimers, 60000)` — up to 60s of jitter.
- Fires when a task's `endDate` is within the **next 15 minutes**, not at the actual time.
- Only runs while the app tab is open and the OS hasn't suspended the page.

So a chore set for 9:00 AM might ping at 8:46 AM (15-min window) — or not at all if the tab was backgrounded. Apple's Tasks app reminds you exactly at 9:00 AM because it hands the schedule to the OS at create-time.

## Goal

Schedule a notification for a specific timestamp at the moment the task is created/updated, so it fires exactly on time even if the app is closed.

## Per-task data model

Add to `Task`:

- `reminderAt?: string` — ISO timestamp when the user wants to be pinged. Distinct from `doDate` (drop-dead deadline) and `endDate` (final deadline). `reminderAt` is optional and explicit — only set if the user picked a time.
- For recurring tasks (chores with `recurrence !== 'once'`): the reminder regenerates each period from `reminderAt`'s time-of-day applied to the next due date. Only one scheduled notification at a time per task.

UI in `task-form.tsx`: add a "Remind me at" datetime picker, visible whenever `category === 'chore'` or `recurrence !== 'once'` (and optionally for project-work tasks too — useful for one-off meeting-style things).

## Scheduling layer

Stop polling. Build a `scheduleTaskReminder(task)` and `cancelTaskReminder(taskId)` API that's called from:

- `addTaskAsync` / `updateTaskAsync` (after a successful write).
- `deleteTaskAsync`.
- Recurring-task completion handlers (cancel current, schedule next period).

Implementation routes by environment:

1. **Capacitor (mobile build).** Already in `package.json` — `@capacitor/local-notifications`. Use `LocalNotifications.schedule({ notifications: [{ id, title, body, schedule: { at: new Date(reminderAt) } }] })`. Cancel via `LocalNotifications.cancel({ notifications: [{ id }] })`. These fire even if the app is killed.
2. **PWA / installed web.** Use the registered service worker with the Notifications API + a stored timestamp. The service worker can use `setTimeout` while the SW is alive, but the **reliable** path is to let the OS push a periodic-sync or, more practically, fall back to scheduling via the `chrome.alarms`-equivalent in the SW. For broad browser support, write the upcoming reminder to IndexedDB and have the SW (a) re-arm a `setTimeout` on every `activate`/`message` event, (b) check on `periodicsync` if available. Notifications do still fire when the SW is activated by a push or sync event.
3. **Plain browser tab open.** Schedule a `setTimeout` for the exact delta. Fires precisely if the tab stays open. Falls back to "missed it" gracefully on next load (see catch-up rule below).

A single scheduler module hides the routing — callers just say `scheduleTaskReminder(task)`.

## Catch-up rule

On app load (and on tab focus), iterate active tasks: for any `reminderAt` in the past **within the last N minutes** (e.g. 30) where no notification was delivered, fire it now with a "(was due X minutes ago)" suffix. Track delivered IDs in IndexedDB so we don't double-fire across reloads.

## Recurring chores

For a daily chore with `reminderAt: 2026-04-27T09:00:00Z`:

- After it's marked done for today, the scheduler computes the next occurrence (tomorrow 9:00 local) and schedules that one.
- If skipped/missed, the next period's reminder still schedules normally — we don't try to "make up" missed days.
- Weekly/monthly/custom: same logic, advance by the period.

## Notification payload

Each scheduled notification carries:

- `taskId` (so tap-to-open routes to `/tasks?taskId=...`).
- A short, recognizable title — `"Chore reminder"` or `"Reminder: <task title>"`.
- The body could include the do-date if different from the reminder time.

## Out of scope (for the first cut)

- Snooze / "remind me again in 10 min" — useful but a follow-up.
- Multi-reminder per task (e.g. 1 day before + at time) — also a follow-up. Today: one reminder per task.
- Cross-device dedupe — if the user has the PWA on desktop and the mobile app installed, both will fire. Acceptable for now.

## Files to touch

- `src/lib/types.ts` — add `reminderAt?: string` to `Task`.
- `src/components/task-form.tsx` — add the "Remind me at" picker.
- `src/lib/notification-service.ts` — extract a `scheduleTaskReminder` / `cancelTaskReminder` API; route to Capacitor vs SW vs in-tab `setTimeout`.
- `src/lib/data-service.ts` (or a thin wrapper) — call schedule/cancel on add/update/delete.
- `src/components/reminder-manager.tsx` — slim down to the **catch-up** loop only (run on load and on focus, not every 60s).
- `public/sw.js` (or wherever the service worker is registered) — add the schedule-on-message + IndexedDB lookup.
- `src/app/chores/page.tsx` — surface the next reminder time on the chore card.

## Suggested first step

Wire it up for the Capacitor / mobile build first (lowest risk, most reliable OS scheduling). Then add the SW path. The plain-tab `setTimeout` is the cheapest and can ship alongside.
