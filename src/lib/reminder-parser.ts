import type { Priority } from './types';

/**
 * Heuristic natural-language reminder parser.
 *
 * Turns phrases like "remind me to call mom tomorrow at 5pm" into a title, an
 * optional due timestamp, and an optional priority. It is intentionally simple
 * and forgiving: anything it can't parse falls back to a plain reminder with no
 * date rather than failing.
 *
 * Time handling: callers pass the device's current epoch (nowMs) and
 * getTimezoneOffset() value (tzOffsetMinutes, i.e. minutes to ADD to local time
 * to reach UTC). All date math is done in the user's local wall-clock frame and
 * the result is emitted as a correct UTC ISO instant.
 */

export interface ParsedReminder {
  title: string;
  dueIso?: string;
  priority: Priority;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const DEFAULT_HOUR = 9; // when a date is given with no time
const DEFAULT_MINUTE = 0;

/** Local wall-clock parts of an instant, given a tz offset (minutes to add to local to get UTC). */
function localParts(epochMs: number, tzOffsetMinutes: number) {
  const shifted = new Date(epochMs - tzOffsetMinutes * 60000);
  return {
    y: shifted.getUTCFullYear(),
    mo: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    mi: shifted.getUTCMinutes(),
    dow: shifted.getUTCDay(),
  };
}

/** Build a UTC ISO instant from local wall-clock components. */
function localToIso(y: number, mo: number, d: number, h: number, mi: number, tzOffsetMinutes: number): string {
  return new Date(Date.UTC(y, mo, d, h, mi) + tzOffsetMinutes * 60000).toISOString();
}

function stripTriggers(text: string): string {
  return text
    .replace(
      /^\s*(urgent\s+|important\s+|asap\s+)?(hey\s+|ok\s+|okay\s+)?(google[\s,]+)?(please\s+)?(can you\s+)?(remind me(\s+to|\s+that|\s+about)?|add (a |an )?reminder(\s+to|\s+for|\s+about)?|set (a |an )?reminder(\s+to|\s+for|\s+about)?|create (a |an )?reminder(\s+to|\s+for|\s+about)?|new reminder(\s+to|\s+for|\s+about)?|remember to|note to self)[\s,:\-]*/i,
      ''
    )
    // Drop the app name when the user said "…in Dash" / "…on Dash" to invoke it.
    .replace(/\b(in|into|on)\s+dash\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectPriority(lower: string): Priority {
  if (/\b(urgent|asap|right away|emergency)\b/.test(lower)) return 'urgent';
  if (/\b(important|high priority|high-priority)\b/.test(lower)) return 'high';
  return 'medium';
}

interface TimeMatch { hour: number; minute: number; raw: string; }

function matchTime(lower: string): TimeMatch | null {
  if (/\bnoon\b/.test(lower)) return { hour: 12, minute: 0, raw: 'noon' };
  if (/\bmidnight\b/.test(lower)) return { hour: 0, minute: 0, raw: 'midnight' };
  if (/\btonight\b/.test(lower)) return { hour: 20, minute: 0, raw: 'tonight' };
  if (/\bthis morning\b/.test(lower)) return { hour: 9, minute: 0, raw: 'this morning' };
  if (/\bthis afternoon\b/.test(lower)) return { hour: 15, minute: 0, raw: 'this afternoon' };
  if (/\bthis evening\b/.test(lower)) return { hour: 19, minute: 0, raw: 'this evening' };

  // "at 5pm", "at 5:30 pm", "5pm", "17:00", "at 17", "at 5 o'clock"
  const m = lower.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b(?:\s*o'?clock)?/);
  if (m) {
    let hour = parseInt(m[1], 10);
    const minute = m[2] ? parseInt(m[2], 10) : 0;
    const mer = m[3];
    if (hour > 23 || minute > 59) return null;
    // Require either a meridiem or a colon or an explicit "at" to avoid grabbing stray numbers.
    const explicit = Boolean(mer) || Boolean(m[2]) || /\bat\s+\d/.test(lower);
    if (!explicit) return null;
    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
    return { hour, minute, raw: m[0].trim() };
  }
  return null;
}

/**
 * Parses a reminder phrase. nowMs/tzOffsetMinutes default to the server clock
 * in UTC when the caller can't supply the device's local frame.
 */
export function parseReminder(
  input: string,
  nowMs: number = Date.now(),
  tzOffsetMinutes: number = 0
): ParsedReminder {
  // Detect priority from the raw phrase (a leading "urgent"/"important" is
  // stripped from the title by stripTriggers, so read it before that).
  const priority = detectPriority((input || '').toLowerCase());
  const original = stripTriggers((input || '').trim());
  const lower = original.toLowerCase();

  const now = localParts(nowMs, tzOffsetMinutes);
  const spans: Array<[number, number]> = []; // [start, end) of matched date/time text, to strip from title

  const recordSpan = (needle: string, from = 0) => {
    const idx = lower.indexOf(needle, from);
    if (idx !== -1) spans.push([idx, idx + needle.length]);
  };

  // --- Date ---
  let dueY = now.y, dueMo = now.mo, dueD = now.d;
  let hasDate = false;

  const relMin = lower.match(/\bin\s+(\d+)\s*(minute|min|hour|hr|day|week)s?\b/);
  const monthDay = lower.match(new RegExp(`\\b(?:on\\s+)?(${MONTHS.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const nextWeekday = lower.match(new RegExp(`\\bnext\\s+(${WEEKDAYS.join('|')})\\b`));
  const bareWeekday = lower.match(new RegExp(`\\b(?:on\\s+|this\\s+)?(${WEEKDAYS.join('|')})\\b`));

  let relativeInstantMs: number | null = null;

  if (relMin) {
    const n = parseInt(relMin[1], 10);
    const unit = relMin[2];
    const perUnitMs: Record<string, number> = { minute: 60000, min: 60000, hour: 3600000, hr: 3600000, day: 86400000, week: 604800000 };
    relativeInstantMs = nowMs + n * perUnitMs[unit];
    recordSpan(relMin[0]);
    hasDate = true;
  } else if (/\bday after tomorrow\b/.test(lower)) {
    const base = new Date(Date.UTC(now.y, now.mo, now.d) + 2 * 86400000);
    dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
    recordSpan('day after tomorrow'); hasDate = true;
  } else if (/\btomorrow\b|\btmrw\b/.test(lower)) {
    const base = new Date(Date.UTC(now.y, now.mo, now.d) + 86400000);
    dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
    recordSpan(lower.includes('tomorrow') ? 'tomorrow' : 'tmrw'); hasDate = true;
  } else if (/\bnext week\b/.test(lower)) {
    const base = new Date(Date.UTC(now.y, now.mo, now.d) + 7 * 86400000);
    dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
    recordSpan('next week'); hasDate = true;
  } else if (/\btoday\b/.test(lower)) {
    recordSpan('today'); hasDate = true;
  } else if (nextWeekday) {
    const target = WEEKDAYS.indexOf(nextWeekday[1]);
    // "next <weekday>" = that weekday in the coming week (7–13 days out).
    const delta = ((target - now.dow + 7) % 7) + 7;
    const base = new Date(Date.UTC(now.y, now.mo, now.d) + delta * 86400000);
    dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
    recordSpan(nextWeekday[0]); hasDate = true;
  } else if (monthDay) {
    const mo = MONTHS.indexOf(monthDay[1]);
    const day = parseInt(monthDay[2], 10);
    let year = now.y;
    // If the date already passed this year, roll to next year.
    if (mo < now.mo || (mo === now.mo && day < now.d)) year += 1;
    dueY = year; dueMo = mo; dueD = day;
    recordSpan(monthDay[0]); hasDate = true;
  } else if (bareWeekday) {
    const target = WEEKDAYS.indexOf(bareWeekday[1]);
    let delta = (target - now.dow + 7) % 7;
    if (delta === 0) delta = 7; // "on monday" said on a Monday = next Monday
    const base = new Date(Date.UTC(now.y, now.mo, now.d) + delta * 86400000);
    dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
    recordSpan(bareWeekday[0]); hasDate = true;
  }

  // --- Time ---
  const time = relativeInstantMs === null ? matchTime(lower) : null;
  let dueIso: string | undefined;

  if (relativeInstantMs !== null) {
    dueIso = new Date(relativeInstantMs).toISOString();
  } else if (hasDate || time) {
    const hour = time ? time.hour : DEFAULT_HOUR;
    const minute = time ? time.minute : DEFAULT_MINUTE;
    // Time given with no explicit date: use today, or tomorrow if it already passed.
    if (!hasDate && time) {
      const todayAt = Date.UTC(now.y, now.mo, now.d, hour, minute) + tzOffsetMinutes * 60000;
      if (todayAt <= nowMs) {
        const base = new Date(Date.UTC(now.y, now.mo, now.d) + 86400000);
        dueY = base.getUTCFullYear(); dueMo = base.getUTCMonth(); dueD = base.getUTCDate();
      }
    }
    if (time) recordSpan(time.raw);
    dueIso = localToIso(dueY, dueMo, dueD, hour, minute, tzOffsetMinutes);
  }

  // --- Title: strip matched date/time spans and tidy leftover filler. ---
  let title = original;
  spans.sort((a, b) => b[0] - a[0]);
  for (const [s, e] of spans) {
    title = title.slice(0, s) + ' ' + title.slice(e);
  }
  title = title
    .replace(/\s+/g, ' ')
    .replace(/\s*[,\-]\s*$/, '')
    .replace(/\s+(at|on|by|for)\s*$/i, '')
    .replace(/^(to|that|about)\s+/i, '')
    .trim();

  if (!title) title = original.trim() || 'Reminder';

  return { title, dueIso, priority };
}
