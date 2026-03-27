import { EnergyLevel } from './types';

const ENERGY_LOG_KEY = 'dash-energy-log';

export interface EnergyEntry {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  level: EnergyLevel;
}

export function getEnergyLog(): EnergyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ENERGY_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEnergyLog(log: EnergyEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENERGY_LOG_KEY, JSON.stringify(log));
}

export function logEnergy(level: EnergyLevel): void {
  const now = new Date();
  const entry: EnergyEntry = {
    date: now.toISOString().split('T')[0],
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    level,
  };
  const log = getEnergyLog();
  log.push(entry);
  saveEnergyLog(log);
}

export function getTodayEnergy(): EnergyLevel | null {
  const today = new Date().toISOString().split('T')[0];
  const log = getEnergyLog();
  const todayEntries = log.filter(e => e.date === today);
  if (todayEntries.length === 0) return null;
  // Return the most recent entry for today
  return todayEntries[todayEntries.length - 1].level;
}

export function hasCheckedInToday(): boolean {
  return getTodayEnergy() !== null;
}

// Energy matching score: how well does a task's energy requirement match current energy
export function getEnergyMatch(taskEnergy: EnergyLevel | undefined, currentEnergy: EnergyLevel): 'match' | 'slight-mismatch' | 'mismatch' {
  if (!taskEnergy) return 'match'; // No requirement = always fine

  const levels: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 };
  const diff = Math.abs(levels[taskEnergy] - levels[currentEnergy]);

  if (diff === 0) return 'match';
  if (diff === 1) return 'slight-mismatch';
  return 'mismatch';
}

// Get energy patterns from history (needs at least 7 days of data)
export interface EnergyPattern {
  avgByHour: Record<number, { level: EnergyLevel; count: number }>;
  weekdayAvg: EnergyLevel | null;
  weekendAvg: EnergyLevel | null;
  peakHour: number | null;
  lowHour: number | null;
}

export function getEnergyPatterns(): EnergyPattern | null {
  const log = getEnergyLog();
  if (log.length < 7) return null;

  const hourCounts: Record<number, { high: number; medium: number; low: number }> = {};
  let weekdayScores: number[] = [];
  let weekendScores: number[] = [];
  const levelToNum: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 };
  const numToLevel = (n: number): EnergyLevel => n >= 2.5 ? 'high' : n >= 1.5 ? 'medium' : 'low';

  for (const entry of log) {
    const hour = parseInt(entry.time.split(':')[0]);
    if (!hourCounts[hour]) hourCounts[hour] = { high: 0, medium: 0, low: 0 };
    hourCounts[hour][entry.level]++;

    const dayOfWeek = new Date(entry.date).getDay();
    const score = levelToNum[entry.level];
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendScores.push(score);
    } else {
      weekdayScores.push(score);
    }
  }

  const avgByHour: Record<number, { level: EnergyLevel; count: number }> = {};
  let peakHour: number | null = null;
  let lowHour: number | null = null;
  let peakScore = 0;
  let lowScore = 4;

  for (const [hourStr, counts] of Object.entries(hourCounts)) {
    const hour = parseInt(hourStr);
    const total = counts.high + counts.medium + counts.low;
    const avg = (counts.high * 3 + counts.medium * 2 + counts.low) / total;
    avgByHour[hour] = { level: numToLevel(avg), count: total };

    if (avg > peakScore) { peakScore = avg; peakHour = hour; }
    if (avg < lowScore) { lowScore = avg; lowHour = hour; }
  }

  const weekdayAvg = weekdayScores.length > 0
    ? numToLevel(weekdayScores.reduce((a, b) => a + b, 0) / weekdayScores.length)
    : null;
  const weekendAvg = weekendScores.length > 0
    ? numToLevel(weekendScores.reduce((a, b) => a + b, 0) / weekendScores.length)
    : null;

  return { avgByHour, weekdayAvg, weekendAvg, peakHour, lowHour };
}
