# Focus Seasons: Intentional Priority Shifting

## The Problem

Taskflow currently treats every habit, goal, and pillar with equal weight. There's no mechanism to say "reading matters less right now, organization matters more" — and have the system respond. Users can add commitments easily but have no guilt-free way to reduce scope.

This creates two failure modes:
1. **Silent abandonment** — habits just stop getting checked, streaks break, and the user feels guilty rather than intentional.
2. **Everything stays equal** — the user maintains 12 habits at the same priority forever, spreading thin instead of going deep on what matters now.

The psychological principle: **saying no to something is harder than saying yes to everything.** A Focus Season makes the trade-off explicit and guilt-free.

## Core Concept

A **Focus Season** is a 2-4 week declared period where the user explicitly sets:
- What to do **MORE** of (1-2 growth areas)
- What to do **LESS** of (1-2 maintenance areas)

The system then adjusts its behavior — visual priority, streak pressure, planning suggestions, and celebrations — to align with the declared focus.

This is NOT about disabling features. It's about the app understanding context and responding proportionally.

## Data Model

```typescript
interface FocusSeason {
  id: string;
  title: string;                    // e.g., "Organization Sprint"
  startDate: string;                // ISO date
  endDate: string;                  // ISO date
  status: 'active' | 'completed' | 'abandoned';

  // What to prioritize
  growthPillars: string[];          // Pillar IDs — boosted visibility
  growthGoals: string[];            // Goal IDs — boosted visibility
  growthHabits: string[];           // Habit (Task) IDs — full streak pressure

  // What to deprioritize
  maintenanceHabits: string[];      // Habit IDs — dimmed, relaxed streak rules

  // Reflection
  intention: string;                // "I want to focus on X because..."
  retrospective?: string;          // Filled at season end
}
```

Add to `UserProgress`:
```typescript
activeSeason?: FocusSeason;
seasonHistory?: FocusSeason[];
```

## How Each Area Changes

### 1. Habit Dimming (Maintenance Mode)

Habits marked as "maintenance" for the current season behave differently:

| Behavior | Growth Habit | Maintenance Habit |
|----------|-------------|-------------------|
| Dashboard visibility | Normal | Slightly dimmed (opacity-60) |
| Streak-at-risk warning | Orange flame after 6 PM | No warning |
| Streak break penalty | Full break | Protected (auto-shielded) |
| Daily Plan inclusion | Always included | Included but lower priority |
| Mastery tier display | Full tier badge | Small muted label |
| Celebration on completion | Normal confetti | Subtle (small intensity) |

The key insight: maintenance habits still *exist* and still *count* — they just don't generate pressure. The user can still do them, still get XP, still maintain streaks. But missing one doesn't feel like failure.

**Implementation:**
- In `calculateStreak()` / `isHabitAtRisk()`: check if habit ID is in `activeSeason.maintenanceHabits` — if so, skip at-risk logic
- In dashboard rendering: apply dimmed styles to maintenance habits
- In `todayList` sorting: push maintenance habits lower in the order

### 2. Priority Boost (Growth Mode)

Tasks and habits linked to growth pillars/goals get visual prominence:

- **Daily Plan**: Growth-linked items sort to the top with a subtle accent border
- **Morning Launch**: warmup task selection prefers growth-linked tasks
- **Stats strip**: show season progress ("Organization: 12/15 tasks done this season")
- **Weekly Report**: add a "Season Focus" section showing progress toward the declared growth area

**Implementation:**
- In `todayList` sorting: boost items whose `goalId` maps to a growth pillar
- In Morning Launch: filter `topTasks` to prefer growth-linked tasks for warmup
- In Weekly Report: compute tasks completed that are linked to growth pillars vs. total

### 3. Conscious Trade-Off Prompt (Weekly Review)

During the existing Weekly Report or Sunday ritual:

Add a 2-question micro-reflection:
- "What should you do MORE of next week?"
- "What should you do LESS of?"

One sentence each. This can be a simple text input below the weekly report grid, stored in localStorage by week key. It's not a full feature — it's a nudge that forces the rebalancing decision.

**Implementation:**
- Add to `DashboardWeeklyReport` component: two small text inputs below the narrative
- Store in localStorage: `weekly-tradeoff-{yyyy-Www}` with `{ more: string, less: string }`
- Show previous week's answer as context when filling in the new one

### 4. Season Lifecycle

#### Starting a Season
- Accessible from Dashboard or a new section on the Alignment/Goals page
- Simple form: title, duration (2/3/4 weeks), select growth pillars/goals, select maintenance habits
- Write a one-sentence intention ("I'm focusing on organization because my workspace is chaotic and it's affecting my focus")

#### During a Season
- Small badge on dashboard showing season name + days remaining
- All UI adjustments active (dimming, boosting, relaxed streak rules)
- Season progress visible in weekly report

#### Ending a Season
- Auto-prompt when end date arrives (modal similar to DayCompleteRecap)
- Show stats: growth area tasks completed, maintenance habits maintained, focus hours in growth area
- Retrospective text input: "What changed? What will you carry forward?"
- Options: "Start a new season" / "Take a break" (return to equal-weight mode)
- Completed seasons saved to `seasonHistory` for long-term pattern tracking

## Where It Lives in the UI

### New UI Surfaces (Minimal)
1. **Season setup modal** — triggered from dashboard or goals page, similar to existing Goal creation dialog
2. **Season badge on dashboard** — small inline badge next to the date in the stats strip (e.g., "Organization Sprint — 8 days left")
3. **Season end modal** — similar to DayCompleteRecap with stats + retrospective input
4. **Season history** — small section on the Alignment page showing past seasons

### Modified Existing Surfaces
1. **Dashboard habits accordion** — maintenance habits get dimmed styling
2. **Dashboard todayList** — growth items sort higher
3. **Morning Launch** — prefers growth-linked warmup tasks
4. **Weekly Report** — adds season progress section + trade-off prompt
5. **Habits page** — maintenance habits show a "Maintenance" badge instead of at-risk warnings

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `FocusSeason` interface, add fields to `UserProgress` |
| `src/lib/data.ts` | CRUD for seasons (or store in UserProgress) |
| `src/lib/habits.ts` | `isHabitAtRisk()` checks maintenance mode |
| `src/app/page.tsx` | Season badge, todayList sorting boost, habit dimming |
| `src/components/morning-launch.tsx` | Prefer growth-linked warmup tasks |
| `src/components/dashboard-weekly-report.tsx` | Season progress section, trade-off prompt |
| `src/app/habits/page.tsx` | Maintenance badge on dimmed habits |
| `src/app/goals/page.tsx` or `src/app/alignment/page.tsx` | Season setup trigger, season history |

## Strategy Guide Addition

Add to the **Weekly & Monthly Rituals** workflow:
- New step: "Season Check — Are you in a Focus Season? If so, is it still the right focus? If not, consider starting one."

Add to the **Motivation Fade** battle plan:
- New action: "Declare a Focus Season" — "When everything feels equally important, nothing feels urgent. Pick 1-2 areas to go deep on for 2-3 weeks. The system will dim everything else and amplify your chosen focus. This is not quitting — it's strategic narrowing."

## Neurochemistry

| Chemical | Mechanism |
|----------|-----------|
| **Dopamine** | Novelty of a new season, fresh challenge framing |
| **Serotonin** | Status/identity — "I'm in an Organization Sprint" feels like a role |
| **Cortisol (healthy)** | Season countdown creates mild urgency without panic |
| **Norepinephrine** | Boosted items feel more important, alertness around growth area |

## Anti-Patterns to Avoid

- **Don't allow more than 2 growth areas** — if everything is growth, nothing is
- **Don't punish maintenance habits** — they should still earn XP, just less pressure
- **Don't make seasons mandatory** — the equal-weight default should always be available
- **Don't make season setup complex** — 3 inputs max: title, duration, what to focus on. The habit dimming can be auto-inferred from pillar selection
- **Don't show season history prominently** — it's reference data, not a dashboard widget

## Implementation Order

1. **Data model** — `FocusSeason` type + `UserProgress` fields
2. **Season setup modal** — simple form with pillar/habit selection
3. **Habit dimming** — modify `isHabitAtRisk()` + dashboard rendering
4. **Priority boost** — modify `todayList` sorting
5. **Season badge** — dashboard stats strip
6. **Weekly trade-off prompt** — two text inputs in weekly report
7. **Season end modal** — stats + retrospective
8. **Morning Launch integration** — growth-linked warmup preference
9. **Strategy Guide updates** — document in workflows and battle plans
