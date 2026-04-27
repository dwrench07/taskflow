/**
 * Centralized descriptions for all dashboard widgets.
 * Used by the WidgetInfo component to explain what each widget does.
 */
export const WIDGET_DESCRIPTIONS: Record<string, string> = {
  // Overview cards
  "overview-todo": "Total tasks with 'To-Do' status. These haven't been started yet.",
  "overview-in-progress": "Tasks you've started working on. Ideally, keep this number low — focus on finishing before starting new work.",
  "overview-due-today": "Tasks with a deadline set for today. These need your attention before the day ends.",
  "overview-habit-goals": "Habits that have met their target streak length vs. total habits with streak goals set.",
  "overview-longevity": "Habits with active streaks longer than 3 days. A measure of consistency over time.",
  "overview-avoided": "Tasks that have been pushed (postponed) at least once. A high number may signal avoidance patterns.",

  // Charts
  "completion-chart": "Shows how many tasks and habits you completed each day this week. Use the arrows to navigate between weeks. Helps spot productivity patterns across the week.",
  "status-chart": "Bar chart showing the current distribution of all non-habit tasks across To-Do, In Progress, and Done statuses.",
  "priority-chart": "Pie chart showing the priority distribution (Urgent, High, Medium, Low) of all active, uncompleted tasks.",

  // Deep Work
  "focus-distribution": "Donut chart showing where your deep work time goes, grouped by the first tag on each task. 'Untagged' means the task has no tags; 'Unassigned' means the focus session wasn't linked to any task.",
  "distraction-score": "Tracks the average number of Jots (quick distraction captures) per hour of focus, over the last 7 days. Lower is better — it means fewer interruptions during deep work.",
  "peak-hours": "Identifies your most productive times of day based on focus session data. The dot matrix shows when sessions happened; the bar chart highlights your best-performing hours.",
  "energy-matrix": "Cross-references your energy level (High / Med / Low) when starting a focus session with the output quality you rated afterward. Reveals whether you perform best at high energy or if energy doesn't matter as much as you think.",
  "worry-accuracy": "Tracks whether the things you worried about before a focus session actually happened, partially happened, or didn't happen at all. Helps calibrate anxiety — most fears don't come true.",
  "emotion-productivity": "Correlates pre-focus emotions (like Dread or Excited) with the output quality of those sessions. Shows whether negative emotions actually reduce your productivity or if 'the feeling lies.'",
  "timelimit-adherence": "Compares your Parkinson's Law time limits (timeboxes) against actual time spent via focus sessions. Shows if you're finishing within limits or consistently overrunning.",

  // Strategic
  "goal-velocity": "Tracks progress speed toward your goals. The line chart plots cumulative progress over time, showing acceleration or stalling for each goal.",
  "goals": "Lists all your goals with their current progress percentage. Linked tasks and milestones contribute to each goal's completion.",
  "goal-coverage": "Shows what percentage of your active tasks are linked to a specific goal. Unlinked tasks don't drive any goal forward — consider linking or deprioritizing them.",
  "pillar-balance": "Compares how your time and task completions are distributed across your life pillars (e.g., Health, Wealth, Wisdom). Imbalance means one area is being neglected.",

  // Performance
  "weekly-report": "Snapshot of this week's key metrics: tasks completed, focus hours, active habits, frogs eaten, and pushes. Compares against last week where applicable.",
  "daily-wins": "Celebrates what you've accomplished today — tasks, habits, frogs, streaks, and focus time. Also includes a daily win log for identity-reinforcing reflections. XP and level progression are tracked here.",
  "point-of-no-return": "Tasks approaching or past their 'Drop Dead Date' (doDate) — the last possible day to start and still finish on time. These need immediate action.",
  "overdue-risk": "Tasks at risk of becoming overdue based on their end date and current status. Sorted by urgency to help you triage.",
  "almost-done": "Projects that are 60%+ complete (based on child-task progress) but not yet finished. These are quick wins — just push through the last few tasks.",
  "push-analytics": "Analyzes your task-pushing (postponing) behavior. Shows how often you push, which reasons you use most, and which tasks get pushed repeatedly.",
  "approach-score": "Measures approach vs. avoidance behavior. Approach points come from completing focus sessions on tasks that felt scary or uncomfortable. Avoidance points come from pushing tasks for emotional reasons like 'too scary' or 'too boring.'",
  "frog-completion": "Tracks how well you're eating your frogs (hardest/most-dreaded tasks). Shows completion rates and how early in the day you tackle them.",
  "blocker-insights": "Analyzes task dependency chains. Shows which tasks are blocked by others, and which 'key blocker' tasks would unblock the most downstream work if completed first.",
  "tshirt-accuracy": "Compares your T-Shirt size estimates (S/M/L/XL) against actual time spent via focus sessions. Reveals whether you're consistently under- or over-estimating task effort.",
  "push-funnel": "Visualizes the push pipeline: how many tasks enter, how many get pushed once, twice, three times, and how many eventually get completed vs. abandoned.",
  "habit-heatmap": "Calendar-style grid showing which days you completed your habits over recent weeks. Darker squares mean more habits completed that day.",
  "stats": "Overall progress bars showing task completion rate, habit streak performance, and other aggregate metrics.",
  "upcoming-deadlines": "Lists the next 5 tasks with the nearest deadlines, sorted by date. Includes overdue tasks that still need completion.",

  // Velocity
  "task-velocity": "Measures how quickly you complete tasks from creation to done. The histogram shows the distribution of completion times (same day, 1 day, 2-3 days, etc.).",
  "tag-heatmap": "Shows which task tags (categories) get the most attention based on completed tasks. Helps identify if you're over-investing in some areas while neglecting others.",
  "habit-resilience": "Measures how quickly your habits recover after being broken. A high bounce-back rate (recovered within 2 days) shows resilience; a low rate suggests habits are fragile.",

  // Deep Work (extras)
  "emotion-trends": "Line chart tracking how your pre-focus emotions change over time. Helps identify emotional patterns — e.g., do you tend to feel more dread on Mondays?",
};
