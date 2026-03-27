import { FocusSession, JotCategory } from './types';
import type { ParsedJot } from './types';
import { addDays } from 'date-fns';

export type { ParsedJot } from './types';

// === JOT STRING FORMAT ===
// New format: "[ ] {category:worry} [12:30] My thought text"
// Legacy format: "[ ] [12:30] My thought text" (no category → 'untagged')
// Category tag is optional, checkbox prefix is optional

const CATEGORY_REGEX = /\{category:(\w+)\}\s*/;
const TIMESTAMP_REGEX = /\[(\d{2}:\d{2})\]\s*/;
const CHECKBOX_REGEX = /^\[([ x])\]\s*/;

export function parseJotString(raw: string, sessionId: string, sessionDate: string, taskTitle?: string): ParsedJot {
  let text = raw;
  let category: JotCategory = 'untagged';
  let timestamp: string | undefined;
  let isDone = false;

  // Extract checkbox
  const checkMatch = text.match(CHECKBOX_REGEX);
  if (checkMatch) {
    isDone = checkMatch[1] === 'x';
    text = text.replace(CHECKBOX_REGEX, '');
  }

  // Extract category
  const catMatch = text.match(CATEGORY_REGEX);
  if (catMatch) {
    category = catMatch[1] as JotCategory;
    text = text.replace(CATEGORY_REGEX, '');
  }

  // Extract timestamp
  const tsMatch = text.match(TIMESTAMP_REGEX);
  if (tsMatch) {
    timestamp = tsMatch[1];
    text = text.replace(TIMESTAMP_REGEX, '');
  }

  return {
    text: text.trim(),
    category,
    timestamp,
    isDone,
    sessionId,
    sessionDate,
    taskTitle,
  };
}

export function buildJotString(text: string, category: JotCategory, timestamp?: string): string {
  let result = '[ ] ';
  if (category !== 'untagged') {
    result += `{category:${category}} `;
  }
  if (timestamp) {
    result += `[${timestamp}] `;
  }
  result += text;
  return result;
}

export function parseAllJots(sessions: FocusSession[], taskTitleMap: Record<string, string>): ParsedJot[] {
  const jots: ParsedJot[] = [];

  for (const session of sessions) {
    if (!session.distractions || session.distractions.length === 0) continue;

    const taskTitle = session.taskId ? taskTitleMap[session.taskId] : 'General Focus Session';

    for (const raw of session.distractions) {
      jots.push(parseJotString(raw, session.id, session.startTime, taskTitle));
    }
  }

  return jots;
}

export function getWorryFollowUpDate(sessionDate: string): string {
  return addDays(new Date(sessionDate), 14).toISOString();
}

// Fear vs Reality stats
export interface FearVsReality {
  totalWorries: number;
  resolved: number;
  happened: number;
  didntHappen: number;
  partially: number;
  accuracyRate: number; // % of worries that didn't happen
}

export function calculateFearVsReality(jots: ParsedJot[]): FearVsReality {
  const worries = jots.filter(j => j.category === 'worry');
  const resolved = worries.filter(j => j.followUpResult);
  const happened = resolved.filter(j => j.followUpResult === 'happened').length;
  const didntHappen = resolved.filter(j => j.followUpResult === 'didnt-happen').length;
  const partially = resolved.filter(j => j.followUpResult === 'partially').length;

  return {
    totalWorries: worries.length,
    resolved: resolved.length,
    happened,
    didntHappen,
    partially,
    accuracyRate: resolved.length > 0 ? Math.round((didntHappen / resolved.length) * 100) : 0,
  };
}
