"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Sparkles, Zap, Flame, Snowflake, Trophy, 
  Timer, Target, RefreshCw, Box, Ghost, HelpCircle, ArrowUpCircle,
  Coins, Anchor, Scissors, Clock, Sun, Bookmark, FlameKindling,
  Sunrise, CheckSquare, Repeat, ShoppingBag, Bug, StickyNote,
  Compass, CalendarDays, ChevronDown, ChevronUp, AlertTriangle,
  Lightbulb, Map, Brain, ShieldAlert, Eye, BatteryLow, Activity,
  Orbit, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GAME_RULES = {
  inventory: [
    { name: "Streak Shields", icon: Shield, color: "text-blue-400", desc: "Prevents a habit streak from resetting if you miss a day. Used automatically when you miss a habitual commitment.", earn: "Earned for every 10 days of a consistent habit streak." },
    { name: "Fresh Start Tokens", icon: RefreshCw, color: "text-emerald-400", desc: "Used to clear all overdue do-dates and end-dates from a task, allowing you to restart without baggage.", earn: "Earned by logging mistakes and feedback in the Deep Store." },
    { name: "Composure Coins", icon: Coins, color: "text-amber-400", desc: "Pushes a task deadline by exactly 24 hours with a respectful snooze.", earn: "Earned by finishing tasks that you previously pushed under pressure." },
    { name: "Prediction Crystals", icon: Sparkles, color: "text-purple-400", desc: "Used to feed the Bonsai. Represents your growing ability to predict your own anxiety.", earn: "Earned when a Worry Jot (anxiety) turns out to be inaccurate." },
    { name: "Anchor Weights", icon: Anchor, color: "text-indigo-400", desc: "Feed these to your Bonsai for massive XP. They represent clearing old backlog items.", earn: "Earned by completing one of your 3 oldest pending tasks." },
    { name: "Stretch Tokens", icon: Scissors, color: "text-rose-400", desc: "Represents pushing past your comfort zone.", earn: "Earned by completing Large (L) or Extra Large (XL) tasks without pushing the date even once." },
    { name: "Hourglasses", icon: Clock, color: "text-cyan-400", desc: "Perfect for time-bending growth.", earn: "Earned by finishing a focus session within 5 minutes of your expected time limit." },
    { name: "Dawn Diamonds", icon: Sun, color: "text-orange-400", desc: "Rare energy gems.", earn: "Earned by completing high-energy tasks before 10 AM." },
    { name: "Golden Bookmarks", icon: Bookmark, color: "text-yellow-400", desc: "Represents synthesized knowledge.", earn: "Earned by logging Jots (ideas) during a Pomodoro focus session." },
    { name: "Embers of Continuity", icon: FlameKindling, color: "text-orange-600", desc: "The rarest reward in the system. Represents unbroken daily consistency over a full week.", earn: "Earned by completing 7 consecutive Daily Wins — showing up and finishing something every day for a week straight." },
  ],
  buffs: [
    { name: "Zen Mode", icon: Ghost, color: "text-cyan-400", effect: "Silences all non-essential UI and increases focus XP gains.", trigger: "Complete your first task of the day before 9:30 AM." },
    { name: "Laser Overdrive", icon: Zap, color: "text-yellow-400", effect: "Double XP multiplier for all focus sessions and tasks.", trigger: "Complete a 50+ minute focus session with 0 distractions." },
    { name: "Momentum Surge", icon: ArrowUpCircle, color: "text-emerald-400", effect: "XP boost and smoother task transitions.", trigger: "Complete the final subtask of a complex task." },
    { name: "Brain Fuel", icon: Sparkles, color: "text-pink-400", effect: "Reduces fatigue penalty and increases clarity.", trigger: "Complete a focus session longer than 60 minutes." },
    { name: "Energy Injection", icon: Sun, color: "text-orange-400", effect: "Carries forward momentum from a strong evening wind-down into the next morning. Pairs with early task completion for compound XP.", trigger: "Earn the Twilight Lock reward by completing your Wind Down chore before 11:30 PM for 3 nights in a row." },
  ],
  status: [
    { name: "Frozen State", icon: Snowflake, color: "text-blue-300", desc: "If you don't log in for 3 days, your 'Campfire' freezes. XP gains are reduced until you log a win.", fix: "Log into the app and complete any task or habit." },
    { name: "Seasonal Reset", icon: RefreshCw, color: "text-slate-400", desc: "Every 30 days, your XP and Level reset to 1. Your top-tier badges are archived as Legacy Relics.", why: "Prevents numbers from getting too large and keeps the growth feeling fresh." },
    { name: "Twilight Lock", icon: Sunrise, color: "text-indigo-400", desc: "A nightly ritual mechanic. Complete your Wind Down chore before 11:30 PM for 3 nights in a row to earn a Dawn Diamond and the Energy Injection buff. Each qualifying night also earns +15 XP. The streak resets if you miss a night or complete Wind Down after 11:30 PM.", why: "Sleep consistency is the highest-leverage health habit. Twilight Lock creates a nightly accountability loop — the late-night reward (unlocking Dawn Diamonds) motivates early wind-down rather than late-night scrolling." },
  ]
};

interface WorkflowStep {
  step: string;
  detail: string;
  tip?: string;
}

interface Workflow {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  when: string;
  why: string;
  steps: WorkflowStep[];
  avoid: string[];
  proTips: string[];
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'morning',
    title: 'The Morning Routine',
    icon: <Sunrise className="h-6 w-6" />,
    color: 'text-orange-400',
    when: 'Every morning, within 15 minutes of starting your day.',
    why: 'The entire system is designed around morning planning. This is when you have the freshest perspective and the most agency over your day.',
    steps: [
      { step: 'Energy Check-In', detail: 'A modal pops up asking your current energy level: Low, Medium, or High. Be honest — this determines which tasks get suggested to match your state.', tip: 'If you\'re Low energy, the planner will surface easier warmup tasks. Don\'t lie upward.' },
      { step: 'Daily Review', detail: 'If you have overdue tasks from yesterday, the system presents them one by one. For each: Do Today (move it), Push (requires a reason + written reflection of 5+ characters), or Drop (mark as abandoned).', tip: 'Never skip the written reflection when pushing. "Why is tomorrow truly better?" is the question that builds self-awareness over time.' },
      { step: 'Morning Launch', detail: 'A calm summary shows your top tasks for today (matched to your energy), habits that are due, chores that are due, and a suggested warmup "Start Here" task.', tip: 'Use the warmup task to build your first small win. The Start Here button launches a Focus session directly — one tap to begin.' },
      { step: 'Daily Plan', detail: 'Navigate to the Plan page. Step 1: review your committed work (due today, overdue, habits, chores). Remove anything you don\'t want. Step 2: drag-and-drop to reorder, add up to 5 energy-matched suggestions. Lock In.', tip: 'This takes 2-3 minutes. The order you set here is the order items appear on your dashboard for the rest of the day.' },
    ],
    avoid: [
      'Skipping the Daily Review — overdue tasks pile up invisibly and create background anxiety.',
      'Clicking "Skip Review For Now" repeatedly — this removes the friction that makes procrastination visible.',
      'Planning the night before — your energy level changes overnight. Morning planning is more accurate.',
    ],
    proTips: [
      'Complete your first task before 9:30 AM to trigger the Zen Mode buff (+50 XP, 3-hour boost).',
      'The Energy Check-In also shows you patterns: "Your peak energy is usually around 10 AM." Use this intel.',
      'If a task keeps getting pushed, the system tracks it. After 3 pushes, it automatically becomes a Frog.',
      'The Morning Launch shows a random daily challenge each day (e.g., "Eat a frog today" or "Zero pushes today"). It\'s a lightweight micro-goal that adds novelty to your morning routine.',
      'Can\'t decide what to work on? Hit the "Pick for me" button in your daily plan — it randomly selects an incomplete item and highlights it. Great for decision fatigue on low-energy days.',
    ],
  },
  {
    id: 'tasks',
    title: 'Task Craft',
    icon: <CheckSquare className="h-6 w-6" />,
    color: 'text-blue-400',
    when: 'Whenever you need to capture, organize, or execute work.',
    why: 'Tasks are the atomic unit of Taskflow. How you create them determines whether the entire system works for you or overwhelms you.',
    steps: [
      { step: 'Create with a Do-Date', detail: 'Every task should have a Do-Date (when you plan to work on it) or an End-Date (hard deadline). Without a date, the task won\'t appear in your Daily Plan.', tip: 'Do-Date = "I plan to work on this Tuesday." End-Date = "This is due Tuesday." Use both when they differ.' },
      { step: 'Set a T-Shirt Size', detail: 'S (under 30 min), M (30-90 min), L (2-4 hrs), XL (full day+). This affects XP rewards and determines if the task needs subtasks.', tip: 'If it\'s M or larger, it needs subtasks. Period. "Too Big" is the #1 push reason.' },
      { step: 'Set Energy Level', detail: 'Low (admin, email), Medium (moderate thinking), High (deep creative work). This enables the energy-matching system on the Plan page.', tip: 'Save high-energy tasks for when your Energy Check-In reports "High." The system will suggest them automatically.' },
      { step: 'Break into Subtasks', detail: 'For M/L/XL tasks: add subtasks with their own dates, priorities, and sizes. Each subtask completed gives +2 XP. Completing the final subtask triggers Momentum Surge.', tip: 'Subtasks turn a scary monolith into a series of tiny wins. Each checkmark is a dopamine hit.' },
      { step: 'Tag and Link', detail: 'Add tags for filtering. Link to a Goal via the goal selector. Link to a Milestone for vision-level tracking in the Alignment Engine.', tip: 'Tagged tasks show up in the Tag Heatmap dashboard widget, revealing which areas of your life get the most attention.' },
    ],
    avoid: [
      'Creating tasks without dates — they become invisible ghosts in your backlog.',
      'Creating 40+ tasks at once — cognitive overload. Keep your active list to 10-15 items.',
      'Skipping T-shirt sizing — without it, you can\'t estimate your day and the XP system under-rewards you.',
      'Leaving L/XL tasks without subtasks — they\'ll be pushed forever as "Too Big."',
    ],
    proTips: [
      'Use Templates for repeatable projects. Create once, instantiate many times.',
      'Set a Time Limit (Parkinson\'s Law) on tasks to force focused execution. Finishing within 5 min of the limit earns an Hourglass.',
      'Mark a task as a Frog (🐸) if you know you\'ll resist it. The Frogs page gives tailored interventions.',
      'Completed tasks are hidden by default — your Tasks page only shows active work. Use Filters > Status > Done to see finished items.',
    ],
  },
  {
    id: 'focus',
    title: 'Focus Sessions',
    icon: <Timer className="h-6 w-6" />,
    color: 'text-emerald-400',
    when: 'For any task requiring 15+ minutes of sustained attention.',
    why: 'Focus sessions are where the richest data flows. Jots, emotions, time tracking, and gamification loot all come from here. No Focus = no self-awareness data.',
    steps: [
      { step: 'Pick a Task', detail: 'Select the task you\'re about to work on. This links the session to the task for analytics.', tip: 'You can also start a session from the Frog page or the Morning Launch\'s "Start Here" button.' },
      { step: 'Choose a Mode', detail: 'Pomodoro (25 min), Countdown (custom minutes — use for timeboxed tasks), or Stopwatch (open-ended).', tip: 'Pomodoro is best for standard deep work. Use Countdown when the task has a Time Limit set. Stopwatch for exploration/learning.' },
      { step: 'Pre-Emotion Check-In', detail: 'Before the timer starts, log your emotional state: the emotion label (calm, anxious, excited, etc.) and body tension (1-10).', tip: 'This is not therapy — it\'s data. The system correlates pre-session emotions with productivity scores over time.' },
      { step: 'Work + Capture Jots', detail: 'While the timer runs, any stray thought goes into the Jot log. Type [worry], [todo], [idea], or [random] before the text to categorize it.', tip: 'Jots are the secret weapon. Worry jots feed the Fear vs Reality system. Todo jots can be converted to real tasks later. Idea jots earn Golden Bookmarks.' },
      { step: 'Session Complete', detail: 'Rate your productivity (High/Medium/Low). Log your current energy. Do the post-Emotion Check-In. The delta is tracked.', tip: 'A 50+ minute session with 0 distractions triggers Laser Overdrive (+100 XP, 2× multiplier for 2 hours). A 60+ minute session triggers Brain Fuel.' },
    ],
    avoid: [
      'Using Focus for 2-minute tasks — the overhead isn\'t worth it. Focus is for sustained work.',
      'Ignoring Jots — they\'re the primary data source for the entire worry/idea/todo pipeline.',
      'Skipping emotion check-ins — without them, the Emotion-Productivity correlation dashboard stays empty.',
      'Stopping early without saving — always complete the session to persist your data.',
    ],
    proTips: [
      'Set up Mindfulness Reminders in the Focus settings — they\'ll surface custom mantras during your session.',
      'After a session, visit the Jots page to triage: convert todos to tasks, promote ideas to Deep Store, follow up on worries.',
      'Audio beeps play at 50%, 80%, and 100% of your timer — one beep at halfway, two at 80%, three at completion.',
      'The strategy field lets you write your approach before starting. "Eat the Frog" is auto-set when launched from the Frogs page.',
      'Sessions of 45+ minutes are recognized as "Deep Work" — they trigger the biggest celebration, earn more XP, and are tracked separately. If you can push past the 30-minute mark to 45, the reward jumps significantly.',
    ],
  },
  {
    id: 'habits',
    title: 'Habits & Streaks',
    icon: <Repeat className="h-6 w-6" />,
    color: 'text-violet-400',
    when: 'Check off daily habits on the Dashboard. Manage them on the Habits page.',
    why: 'Habits are the compound interest of self-improvement. The streak system adds stakes — breaking a streak hurts, which keeps you consistent.',
    steps: [
      { step: 'Create a Habit', detail: 'Go to the Habits page, click "Add Habit." Set a title, description, priority, frequency (Daily/Weekly/Monthly), and an optional streak goal.', tip: 'Start with 3-5 habits max. Adding 15 at once guarantees you\'ll abandon most of them.' },
      { step: 'Check Off Daily', detail: 'Use the Dashboard\'s Habits dropdown to mark completion. Each check records the date in completion history and updates the streak counter.', tip: 'The best time to check habits is as you do them throughout the day, not in a batch at night.' },
      { step: 'Track Daily Status', detail: 'On the Habit detail page, you can log a status beyond just "done": Changes Observed, No Changes, or Negative. This gives qualitative texture to your streak.', tip: 'Use this for habits where the result isn\'t binary (e.g., meditation — did you feel calmer?).' },
      { step: 'Monitor the Heatmap', detail: 'The Habits page shows a GitHub-style heatmap of your completion history. Green = active, gaps = missed days.', tip: 'Look for weekly patterns. If you always miss Sundays, consider making it a 6-day habit instead of fighting it.' },
      { step: 'Earn Mastery Tiers', detail: 'As your streak grows, your habit earns a visible tier: Seedling (1-6 days), Rooted (7-20), Growing (21-65), Established (66-179), Mastered (180+). Tiers appear on your habit cards next to the streak count.', tip: 'Tiers give your brain a rank to protect. Losing a "Growing" streak feels worse than losing a 22-day number — that\'s by design. The label makes the investment tangible.' },
    ],
    avoid: [
      'Creating too many habits at once — habit fatigue is real. 3-5 active habits is the sweet spot.',
      'Ignoring broken streaks — visit the Habits page to see if any streaks need attention.',
      'Only tracking binary habits — use the daily status (Changes/No Changes/Negative) for richer data.',
    ],
    proTips: [
      'Every 10-day streak milestone earns a Streak Shield — which protects the streak if you miss one day later.',
      'Habits appear in your Daily Plan automatically. They\'re treated as committed work, not optional.',
      'You can launch a Focus session directly from a habit — useful for habits like "Read for 30 minutes" or "Practice piano."',
      'The Habit Resilience dashboard widget shows which habits have the strongest recovery after breaks.',
      'After 6 PM, any habit with an active streak that hasn\'t been done today shows an orange "at risk" indicator on the Dashboard — a gentle cortisol nudge to protect your streak before bed.',
    ],
  },
  {
    id: 'chores',
    title: 'Chores',
    icon: <ShoppingBag className="h-6 w-6" />,
    color: 'text-amber-400',
    when: 'Chores surface automatically based on their frequency. Check the Dashboard or Chores page.',
    why: 'Chores are routine maintenance tasks separated from your strategic work. They keep life running without polluting your task list.',
    steps: [
      { step: 'Create a Chore', detail: 'Go to the Chores page, click "Add Chore." Set a title and optional description. Chores default to Daily frequency with Medium priority and energy.', tip: 'Good chores: "Do laundry," "Clean kitchen," "Water plants." These are recurring, non-creative tasks.' },
      { step: 'Mark Complete', detail: 'Tap the chore card to toggle completion. It records today\'s date as Last Completed. The card shows a green checkmark for the rest of the day.', tip: 'Chores also appear in your Morning Launch and Daily Plan, so you can check them off from the main workflow too.' },
      { step: 'Frequency Gates Automatically', detail: 'A daily chore reappears every day. A weekly chore only surfaces after 7 days since last completion. A monthly chore after 30 days. You never have to track "when was this last done."', tip: 'If a high-priority weekly chore hasn\'t been done, it also surfaces on the Plan page even if it isn\'t quite 7 days.' },
    ],
    avoid: [
      'Putting strategic work as chores — chores are for maintenance, not milestones.',
      'Ignoring chores until they pile up — the frequency system handles scheduling automatically if you stay on top of them.',
    ],
    proTips: [
      'Chores earn XP just like tasks when completed during a Daily Plan.',
      'The Dashboard groups chores in their own collapsible dropdown — they don\'t clutter your task list.',
      'Batch similar chores together on a specific day (e.g., "Sunday = all weekly chores") to build a ritual.',
    ],
  },
  {
    id: 'frogs',
    title: 'Eat the Frog 🐸',
    icon: <Bug className="h-6 w-6" />,
    color: 'text-green-400',
    when: 'Visit the Frogs page when you need to confront your most-resisted work.',
    why: '"Eat a live frog first thing in the morning and nothing worse will happen to you the rest of the day." Frogs are the tasks you\'re avoiding — and avoiding them costs more energy than doing them.',
    steps: [
      { step: 'Frogs Are Auto-Identified', detail: 'A task becomes a Frog if: (a) you manually mark it as a Frog, (b) it has been pushed 3+ times, or (c) it has Urgent priority AND High energy level.', tip: 'You don\'t have to remember to flag them. The system catches avoidance patterns automatically.' },
      { step: 'See the Avoidance Pattern', detail: 'Each Frog card shows its push count, the top push reason (e.g., "Pushed as Too Scary 3/4 times"), and a tailored intervention.', tip: 'Read the intervention seriously. "Start with just 2 minutes" for Too Scary tasks actually works — starting is the hardest part.' },
      { step: 'Eat It', detail: 'Click "Eat This Frog" to immediately launch a Focus session (Pomodoro mode) with the "Eat the Frog" strategy pre-loaded.', tip: 'Eating Frogs early triggers Zen Mode if done before 9:30 AM, and earns the Frog Eater badge (1/5/25 frogs).' },
      { step: 'Watch for Decay', detail: 'Frogs that sit undone for 3+ days turn amber. After 7+ days, they turn red. This visual rot is intentional — your brain processes color-based urgency faster than numbers. A red frog demands attention in a way that "pushed 5 times" doesn\'t.', tip: 'If a frog has turned red, it\'s been sitting too long. Either eat it now, break it into smaller subtasks, or honestly ask yourself: should this be abandoned instead?' },
    ],
    avoid: [
      'Ignoring the Frogs page entirely — these are your highest-value tasks precisely because they\'re hard.',
      'Manually un-marking tasks as Frogs to make the page look clean — you\'re hiding from yourself.',
      'Letting a frog turn red and then ignoring the color — the decay is a signal to act, not decoration.',
    ],
    proTips: [
      'The push interventions are specific: Too Scary → "Start with 2 minutes." Too Vague → "Define the first step." Too Big → "Break into subtasks." Too Boring → "Pair with music."',
      'Completing a task that was pushed specifically because it was "Too Scary" earns the Fear Crusher badge.',
      'Frogs are sorted by "resistance score" — the most-pushed, most-urgent ones float to the top.',
      'After eating a frog, a quick reflection asks "How hard was that really?" Most people discover it was easier than expected — this builds a feedback loop that weakens future dread.',
    ],
  },
  {
    id: 'jots',
    title: 'Jots & Deep Store',
    icon: <StickyNote className="h-6 w-6" />,
    color: 'text-pink-400',
    when: 'Capture Jots during Focus sessions. Triage them on the Jots page. Park long-term thoughts in the Deep Store.',
    why: 'Your brain generates valuable stray thoughts during focus. Jots capture them without breaking flow. The Deep Store is where those thoughts mature into actionable items or dissolve as irrelevant.',
    steps: [
      { step: 'Capture During Focus', detail: 'During any Focus session, type thoughts into the Jot log. Prefix with [worry], [todo], [idea], or [random] for auto-categorization.', tip: 'Capturing a worry jot is the first step in the Fear vs Reality system — you\'ll follow up later to see if it actually happened.' },
      { step: 'Triage on the Jots Page', detail: 'Navigate to /jots. Filter by category. For each jot: check it off (done), convert a Todo to a real Task, or promote any jot to the Deep Store (Back of Mind).', tip: 'The Fear vs Reality card shows your stats: "Of 12 worried thoughts, 9 never happened (75% accuracy)." This retrains your anxiety.' },
      { step: 'Deep Store Management', detail: 'The Back of Mind page holds long-term thoughts categorized as Worry, Idea, Question, Someday, Task Idea, or Other. Each has a relevance score (1-10). Use the Random Surface button to retrieve forgotten items.', tip: 'Sweep the Deep Store weekly. Delete stale items. Promote ripe ones to real tasks. This keeps your mental backlog clean.' },
      { step: 'Mistake Log', detail: 'Within the Deep Store, there\'s a Mistakes tab. Log mistakes with lessons learned. Each logged mistake earns a Fresh Start Token.', tip: 'The Mistake Log is not punishment — it\'s gamified learning. Documenting a mistake and lesson is worth +25 Bonsai XP via the Fresh Start Token.' },
    ],
    avoid: [
      'Never visiting the Jots page — unchecked jots pile up and the insights never surface.',
      'Ignoring worry jot follow-ups — the Fear vs Reality system only works if you report outcomes.',
      'Treating the Deep Store as a dump — items without review become digital anxiety. Sweep it weekly.',
    ],
    proTips: [
      'Worry jots that didn\'t come true earn Prediction Crystals — item loot for your Bonsai (+20 XP).',
      'Todo jots can be converted to tasks in one click, complete with the original session context in the description.',
      'Use the Fear vs Reality percentage as a mantra: "75% of my worries never happen." Data-driven anxiety management.',
    ],
  },
  {
    id: 'alignment',
    title: 'Vision & Alignment',
    icon: <Compass className="h-6 w-6" />,
    color: 'text-indigo-400',
    when: 'Set up once, review monthly. Visit when you feel purposeless despite being "productive."',
    why: 'Habits without goals are just repetition. Tasks without pillars are busy work. The Alignment Engine connects daily execution to life-level purpose.',
    steps: [
      { step: 'Create Life Pillars', detail: 'Go to /alignment and create 3-6 Pillars: the broadest categories of your life (Health, Career, Relationships, Creative, Financial, Spiritual). Assign each a color.', tip: 'Fewer is better. If you have 10 pillars, you don\'t have priorities.' },
      { step: 'Add Goals Under Pillars', detail: 'Go to /goals. Create goals and attach them to a Pillar. Add an optional stretch goal (the ambitious version).', tip: 'Each goal should be achievable in 1-6 months. Larger visions break into multiple sequential goals.' },
      { step: 'Create Milestones', detail: 'Back on /alignment, create Milestones — checkpoints within a pillar. Link tasks to milestones for fine-grained tracking.', tip: 'A Milestone is like a mini-goal: "Run a 5K" under the Health pillar, with tasks like "Week 1: Run 1 mile" linked to it.' },
      { step: 'Link Tasks', detail: 'When creating or editing tasks, use the Goal and Milestone dropdowns. This creates the chain: Pillar → Goal → Milestone → Task.', tip: 'The Tree View on /alignment shows this full hierarchy. The Graph View shows dependency connections between tasks.' },
      { step: 'Check Strategic Standing', detail: 'The "Standing" tab on /alignment shows the real-time integrity of each pillar — which are thriving and which are neglected.', tip: 'If one pillar is at 0% for months, either delete it (it\'s not a real priority) or schedule immediate tasks for it.' },
    ],
    avoid: [
      'Creating tasks that aren\'t linked to any goal — they become purposeless checkbox work.',
      'Having 10+ goals at once — focus on 2-3 active goals per pillar.',
      'Never reviewing the Standing tab — monthly checks prevent silent pillar neglect.',
    ],
    proTips: [
      'The Pillar Balance dashboard widget shows if your daily work is biased toward one area of life.',
      'Use the Dependency Graph to visualize which tasks block others — then prioritize unblockers.',
      'Completing a goal\'s stretch version earns the Pinnacle Push achievement.',
    ],
  },
  {
    id: 'rituals',
    title: 'Weekly & Monthly Rituals',
    icon: <CalendarDays className="h-6 w-6" />,
    color: 'text-teal-400',
    when: 'Sundays for weekly. First of the month for monthly.',
    why: 'Daily execution keeps you moving. Rituals keep you moving in the right direction. Without periodic review, you optimize locally while drifting globally.',
    steps: [
      { step: 'Sunday: Worry Audit', detail: 'Go to /jots, filter by Worry. For each unresolved worry, report the outcome: Happened, Didn\'t Happen, or Partially. This feeds Fear vs Reality stats and earns Prediction Crystals.', tip: 'Most worries don\'t come true. The data proves it — and seeing the proof rewires your anxiety response over time.' },
      { step: 'Sunday: Deep Store Sweep', detail: 'Go to /back-of-mind. Sort by oldest. Delete stale items. Promote actionable ones to tasks. Hit the Random Surface button to rediscover buried ideas.', tip: 'If an item has sat for 30+ days untouched, it\'s probably irrelevant. Delete it without guilt.' },
      { step: 'Sunday: Habit Health Check', detail: 'Go to /habits. Look at the heatmap. Which streaks are solid? Which broke? Should any habit be retired or replaced?', tip: 'A habit you consistently fight might need to be reframed — change the trigger, time, or scope rather than abandoning it entirely.' },
      { step: 'Monthly: Vision Review', detail: 'Go to /alignment → Standing tab. Are your pillars balanced? Is one dominant while another is starving? Adjust goals accordingly.', tip: 'This 10-minute check prevents the classic trap: being excellent at work while your health collapses.' },
      { step: 'Monthly: Mistake Log Review', detail: 'Deep Store → Mistakes tab. Review open entries. Close resolved ones. Each closure earns a Fresh Start Token.', tip: 'Pattern recognition: if the same mistake repeats, it\'s not a mistake — it\'s a system gap that needs a structural fix.' },
    ],
    avoid: [
      'Skipping Sunday rituals for months — drift accumulates silently.',
      'Making weekly reviews a 2-hour ordeal — 15-20 minutes is the target. Quick sweep, not deep analysis.',
    ],
    proTips: [
      'Block "Sunday Reset" as a recurring chore so it shows up in your plan automatically.',
      'The monthly Vision Review pairs well with the Interests page (/interests) — look for convergence between interests and pillars.',
      'After finishing a big project, go to /templates and save its structure for future reuse.',
    ],
  },
];

function WorkflowCard({ workflow, defaultOpen = false }: { workflow: Workflow; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn(
      "border-border overflow-hidden transition-all duration-300 group",
      isOpen ? "bg-card shadow-lg" : "bg-card/50 hover:bg-card"
    )}>
      <button 
        className="w-full text-left" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardHeader className="flex flex-row items-center gap-4 py-5">
          <div className={cn("p-3 rounded-xl bg-muted/50 transition-transform duration-300", workflow.color, isOpen && "scale-110")}>
            {workflow.icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{workflow.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{workflow.when}</p>
          </div>
          <div className="pr-2 text-muted-foreground">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Why */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Why This Matters</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{workflow.why}</p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Step-by-Step</p>
            {workflow.steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black", workflow.color, "border-current")}>
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">{s.step}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
                  {s.tip && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-yellow-600 dark:text-yellow-400 italic">{s.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Avoid */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest pl-1">Common Mistakes</p>
            <div className="space-y-1.5">
              {workflow.avoid.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest pl-1">Pro Tips</p>
            <div className="space-y-1.5">
              {workflow.proTips.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface BattlePlanAction {
  action: string;
  where: string;
  detail: string;
}

interface BattlePlan {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  feelsLike: string[];
  root: string;
  actions: BattlePlanAction[];
  science: string;
  mantra: string;
}

const BATTLE_PLANS: BattlePlan[] = [
  {
    id: 'freeze',
    title: 'The Freeze Response',
    icon: <Snowflake className="h-6 w-6" />,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/10 to-blue-500/5',
    feelsLike: [
      'You know exactly what to do, but your body won\'t start.',
      'Staring at the task list, feeling physically heavy.',
      'Stress hormones fire the moment you open your work — a freeze, not a fight.',
      'The emotional self kicks in before the rational self gets a chance.',
    ],
    root: 'Your amygdala is triggering a threat response to the task itself. Cortisol floods your system, your prefrontal cortex goes offline, and "just do it" becomes neurologically impossible. The fix is not willpower — it\'s reducing the perceived threat until your brain stops blocking you.',
    actions: [
      { action: 'Shrink the task', where: 'Tasks → Edit → Subtasks', detail: 'Break the scary task into absurdly small subtasks. "Write the introduction" becomes "Open the document and type one sentence." The smaller the first step, the less your amygdala fires.' },
      { action: 'Use the 2-minute warmup', where: 'Morning Launch → Start Here', detail: 'The Morning Launch surfaces a low-energy warmup task. Start there. Completing anything — even something trivial — releases dopamine and primes your brain to keep going.' },
      { action: 'Pre-Emotion Check-In', where: 'Focus → Start Session', detail: 'Before the timer starts, log your anxiety level honestly. Naming the emotion ("I feel anxious, tension 7/10") activates your prefrontal cortex and literally weakens the amygdala\'s grip. This is called "affect labeling" — research shows it reduces emotional intensity by 30-50%.' },
      { action: 'Eat the Frog with a timer', where: 'Frogs → Eat This Frog', detail: 'Don\'t decide to start — let the system start for you. Click "Eat This Frog" and the timer begins. External structure removes the decision point where freeze happens.' },
      { action: 'Log the push reason honestly', where: 'Daily Review → Push → Reflect', detail: 'If you freeze and push, write exactly why: "Too Scary." After 3 pushes, the system auto-surfaces this task as a Frog with the intervention: "Start with just 2 minutes. Fear shrinks once you begin."' },
    ],
    science: 'Cortisol takes 1-2 hours to clear from your system even after you mentally let go. This is why "just relax" doesn\'t work — the chemical is physically present. The Emotion Check-In→Timer→Jot pipeline works because it gives your body a structured off-ramp instead of demanding an instant mood shift.',
    mantra: 'You don\'t need to feel ready. You need to feel safe enough to start a 2-minute timer.',
  },
  {
    id: 'drift',
    title: 'The Focus Drift',
    icon: <Orbit className="h-6 w-6" />,
    color: 'text-violet-400',
    gradient: 'from-violet-500/10 to-purple-500/5',
    feelsLike: [
      'You start a task but 15 minutes later you\'re on your phone or a different tab.',
      'New tasks keep burying old ones — nothing ever truly finishes.',
      'You solve the hard 90% of a problem, then abandon the easy 10% until deadline panic.',
      'You go too deep into research before acting, spending hours "preparing" instead of doing.',
    ],
    root: 'Your brain is wired to seek novelty and avoid monotony. The dopamine hit from starting something new is stronger than the serotonin reward of finishing something old. Without external anchors (timers, visible progress), unfinished work has no urgency signal.',
    actions: [
      { action: 'Use Pomodoro mode religiously', where: 'Focus → Pomodoro', detail: 'The 25-minute constraint prevents drift by design. You can\'t "just check one thing" when there\'s a timer counting. Every distraction goes into the Jot log instead of your browser.' },
      { action: 'Capture, don\'t chase', where: 'Focus → Jot Log → [todo]', detail: 'When a new thought pulls you during work, type it as [todo] in the Jot log. It\'s captured. It\'s safe. Your brain can release it because it knows the thought won\'t be lost. Return to the current task.' },
      { action: 'Set Time Limits', where: 'Tasks → Edit → Time Limit', detail: 'Parkinson\'s Law: work expands to fill the time available. Set a Time Limit on tasks to force completion. A 2-hour research task with a 45-minute limit forces you to act instead of endlessly preparing.' },
      { action: 'Track the 90% trap', where: 'Tasks → Subtasks → Final subtask', detail: 'Explicitly create a final subtask called "Ship it / Submit / Send." Completing the last subtask of a parent task triggers Momentum Surge (+50 XP). The system rewards finishing, not just working.' },
      { action: 'Use doDate anchoring', where: 'Tasks → Edit → Do-Date', detail: 'Every task needs a doDate. Without it, the task has no temporal anchor and drifts into the backlog abyss. Dated tasks appear on the Daily Plan, undated tasks don\'t.' },
    ],
    science: 'The "90% done" trap is a form of completion anxiety — your brain associates the final step with judgment ("what if it\'s not good enough?"). Creating an explicit "Ship it" subtask externalizes the decision. It\'s no longer "should I submit?" — it\'s "check the box." Removing the decision removes the resistance.',
    mantra: 'A finished 80% is worth more than a perfect 95% stuck in your drafts.',
  },
  {
    id: 'slow-start',
    title: 'The Slow Start',
    icon: <BatteryLow className="h-6 w-6" />,
    color: 'text-amber-400',
    gradient: 'from-amber-500/10 to-orange-500/5',
    feelsLike: [
      'You can\'t start working until 10:30 AM no matter how hard you try.',
      'Weekday mornings feel groggy and heavy, but Saturdays you wake up fine.',
      'Brain fog, mental heaviness — everything feels muffled until noon.',
      'You nap during the day, then can\'t sleep at night, creating a vicious cycle.',
    ],
    root: 'Your dopamine system has a prediction gap. On Saturdays, your brain anticipates reward (freedom, fun) and releases wake-up dopamine. On weekdays, it predicts effort without clear reward, so it withholds the chemical you need to feel alert. The fix is building a predictable morning reward loop.',
    actions: [
      { action: 'Start with the Energy Check-In', where: 'Dashboard → Morning Modal', detail: 'Be honest: select "Low." The system responds by surfacing only low-energy warmup tasks. You\'re not fighting your state — you\'re working with it. Low-energy tasks are still tasks. Completing them still earns XP, which the brain starts to predict.' },
      { action: 'Chase the Zen Mode buff', where: 'Complete any task before 9:30 AM', detail: 'Zen Mode grants +50 XP and a 3-hour boost. Make this your daily mini-game: can you check off one tiny thing before 9:30? This creates the dopamine prediction your weekday mornings lack — your brain starts anticipating the reward.' },
      { action: 'Use the warmup task', where: 'Morning Launch → Start Here', detail: 'The Start Here task is deliberately trivial (Size S, Low energy). It exists to generate momentum, not productivity. One completed checkbox primes the pump for the next two hours.' },
      { action: 'Log sleep patterns', where: 'Habits → Create "Sleep by midnight" habit', detail: 'Create a habit with a daily frequency. The streak mechanic creates external accountability. Missing the habit breaks the streak — and the Streak Shield you spent 10 days earning is at risk.' },
      { action: 'Front-load chores', where: 'Daily Plan → Move chores to top', detail: 'Physical chores (make bed, wash face, clean desk) don\'t require mental energy but they create motion. Motion creates momentum. Momentum creates focus. Plan them first.' },
    ],
    science: 'Morning grogginess is cortisol and adenosine fighting with your circadian clock. Your brain literally needs a reason to clear the fog — dopamine is that reason. The Zen Mode buff works because it turns "wake up and work" into "wake up and earn a reward before 9:30." Game-like anticipation hacks the same system that makes you alert on Saturdays.',
    mantra: 'You don\'t need energy to start. You need to start to create energy.',
  },
  {
    id: 'overthink',
    title: 'The Overthinking Loop',
    icon: <Brain className="h-6 w-6" />,
    color: 'text-pink-400',
    gradient: 'from-pink-500/10 to-rose-500/5',
    feelsLike: [
      'Your brain randomly connects to anxious thoughts and you cannot stop the spiral.',
      'You freeze under ambiguous conditions — not knowing the outcome paralyzes you.',
      'You over-research and over-plan because acting without certainty feels dangerous.',
      'Intrusive thoughts about worst-case scenarios hijack your focus for hours.',
    ],
    root: 'Intolerance of uncertainty is the engine of overthinking. Your brain treats "I don\'t know what will happen" as a threat equal to "something bad is happening right now." The amygdala can\'t distinguish between real danger and imagined danger — it fires the same cortisol response for both.',
    actions: [
      { action: 'Capture the worry as a Jot', where: 'Focus → Jot Log → [worry]', detail: 'When an anxious thought hits during work, type it with the [worry] tag: "[worry] What if I can\'t find a job in time?" This externalizes the thought from your head to the screen. Your brain can partially release it because it\'s been "recorded" — it won\'t be forgotten.' },
      { action: 'Follow up on Sundays', where: 'Jots Page → Filter: Worry', detail: 'Once a week, review your worry jots and honestly report: Did it happen? Didn\'t happen? Partially? Over time, the Fear vs Reality tracker shows you the data: typically 70-80% of worries never materialize. Seeing this pattern rewires your threat detection.' },
      { action: 'Set a research timebox', where: 'Focus → Countdown mode → 30 min', detail: 'If you catch yourself over-researching, set a strict Countdown timer (20-30 min). When it ends, you must produce a decision or a document — not more research. The timer is the external authority your prefrontal cortex needs.' },
      { action: 'Use the "Too Vague" push reason', where: 'Daily Review → Push → Too Vague', detail: 'If a task keeps getting pushed because you don\'t know how to start, the reason is usually vagueness, not difficulty. Selecting "Too Vague" triggers the intervention: "Spend 5 minutes defining the very first step before starting." Clarity kills anxiety.' },
      { action: 'Park it in the Deep Store', where: 'Deep Store → Add Item → Worry', detail: 'If the anxiety isn\'t about a specific task but a bigger life situation, park it in the Deep Store with a relevance score. It\'s acknowledged but not actionable right now. The Random Surface feature will bring it back when you\'re ready.' },
    ],
    science: 'Affect labeling (writing "I feel anxious about X") measurably reduces amygdala activity. The Fear vs Reality tracker is cognitive behavioral therapy in database form — it forces exposure to evidence that contradicts catastrophic predictions. After 20-30 tracked worries, most people discover their anxiety is accurate less than 25% of the time.',
    mantra: 'Your brain is a threat-detection machine, not a prediction machine. The data will teach it the difference.',
  },
  {
    id: 'fade',
    title: 'The Motivation Fade',
    icon: <Activity className="h-6 w-6" />,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/10 to-green-500/5',
    feelsLike: [
      'Initial excitement about a project fades after 2-3 weeks.',
      'Effort doesn\'t feel rewarding. Progress doesn\'t feel satisfying.',
      'You keep switching between goals and projects, never finishing any.',
      'You watch and read things but only retain summaries, not actionable knowledge.',
    ],
    root: 'Your dopamine reward system is calibrated for novelty, not persistence. New goals trigger a dopamine surge ("this will change everything!") that fades as the work becomes routine. Without visible progress markers and external reward loops, effort feels meaningless and the brain starts hunting for the next shiny thing.',
    actions: [
      { action: 'Make progress visible', where: 'Tasks → Subtasks → Progress bar', detail: 'Break every goal into tasks with subtasks. The progress bar (3/7 completed) provides a visible, updating metric. Each checkbox is a micro-reward that the brain can measure. "I\'m 43% done" is motivating. "I\'ve been working on this" is not.' },
      { action: 'Use the XP system as your feedback loop', where: 'Achievements → XP Today', detail: 'Check your XP gain at the end of each day. The number going up IS the reward signal your brain needs. Even on uninspired days, doing a few small tasks and a focus session yields 30-50 XP. That\'s not nothing — that\'s progress in data form.' },
      { action: 'Link tasks to Vision', where: 'Alignment → Pillars → Goals → Tasks', detail: 'When motivation fades, it\'s usually because the connection between today\'s task and tomorrow\'s outcome has gone dark. The Alignment Engine makes this visible: this task feeds this goal, which feeds this pillar. Open the Standing tab to see which pillars are advancing.' },
      { action: 'Chase badge tiers', where: 'Achievements → Badge Grid', detail: 'Each badge has Bronze → Silver → Gold tiers. "Task Crusher: 47/50 done" is more motivating than "keep going." External progress markers override internal motivation fade. The brain responds to proximity to a goal.' },
      { action: 'Log consumed content as Jots', where: 'Focus → Jot Log → [idea]', detail: 'When you read or watch something, capture the key insight as an [idea] jot during your Focus session. This transforms passive consumption into active synthesis — the idea becomes a concrete artifact you can promote to a task or Deep Store item later.' },
      { action: 'Accept the Daily Challenge', where: 'Morning Launch → Challenge badge', detail: 'Each morning, a random micro-challenge appears: "Eat a frog today," "Zero pushes," or "Complete all habits." It changes daily. The novelty provides a fresh dopamine target that prevents the routine from feeling stale. You don\'t have to complete it — but noticing it primes your brain with a goal before you start.' },
      { action: 'Earn Embers of Continuity', where: '7 consecutive perfect Daily Wins', detail: 'The highest-value loot in the game is earned through consistency, not intensity. Stacking 7 good days in a row is the goal — not one heroic sprint. The Ember is the system\'s way of saying: "you showed up every day, and that\'s the hardest thing."' },
    ],
    science: 'Dopamine is not the "pleasure chemical" — it\'s the "anticipation chemical." It spikes when you predict a reward, not when you receive it. The XP system, badge tiers, and streak counts create persistent prediction targets. Your brain starts asking "how much XP will I earn today?" instead of "do I feel like working?" — and that shift from mood-dependent to game-dependent motivation is the key transition.',
    mantra: 'Motivation follows action. It doesn\'t precede it. Start, and the motivation will catch up.',
  },
  {
    id: 'confidence',
    title: 'The Confidence Gap',
    icon: <ShieldAlert className="h-6 w-6" />,
    color: 'text-rose-400',
    gradient: 'from-rose-500/10 to-red-500/5',
    feelsLike: [
      'You aim for the minimum because reaching for more feels risky.',
      'Confidence is inconsistent — sometimes you feel capable, other times paralyzed.',
      'You avoid tasks labeled "hard" or "important" even when you\'re qualified.',
      'Lingering stress from past failures makes new attempts feel pre-doomed.',
    ],
    root: 'Confidence is not a feeling — it\'s a data trail. Your brain\'s confidence calculation is: (past successes in similar situations) ÷ (past attempts). If you avoid hard things, the denominator never grows, so the ratio stays uncertain. The fix is generating a stream of evidence that your brain can\'t argue with.',
    actions: [
      { action: 'Build an evidence trail', where: 'Achievements → Badge Grid + Inventory', detail: 'Badges and inventory items are physical proof of capability. "Fear Crusher: 5/5 — Gold" means you completed 5 tasks you were terrified of. Your brain can argue with feelings, but it can\'t argue with a counter.' },
      { action: 'Use Stretch Tokens as proof', where: 'Earn by completing L/XL tasks without pushing', detail: 'Each Stretch Token represents a moment where you didn\'t flinch. Every time you complete a large task without pushing it, the token appears in your inventory. Hovering over 3 tokens and knowing what each one represents changes your self-narrative.' },
      { action: 'Review the Fear vs Reality data', where: 'Jots Page → Fear vs Reality card', detail: 'If your tracked worries show that 75% of fears never happened, that\'s not just a nice stat — it\'s direct evidence that your threat-detection system over-fires. Use this to consciously downgrade future anxiety: "historically, 3 out of 4 of my fears are false alarms."' },
      { action: 'Log mistakes in the Deep Store', where: 'Deep Store → Mistakes tab', detail: 'Counter-intuitively, logging failures BUILDS confidence. Each mistake entry requires a lesson learned. This reframes failure from "I\'m broken" to "I\'m learning." Each entry also earns a Fresh Start Token — the system literally rewards you for facing your mistakes.' },
      { action: 'Set and hit stretch goals', where: 'Goals → Stretch Goal field', detail: 'Every goal has a base target and an optional stretch target. Hitting the stretch target earns extra recognition. Even attempting it — even failing — builds the evidence trail. The attempt is the data point, not just the outcome.' },
    ],
    science: 'Self-efficacy theory (Bandura) shows that confidence comes from 4 sources: mastery experiences, vicarious experiences, social persuasion, and physiological states. Taskflow targets #1 directly — every badge, every token, every completed frog is a mastery experience stored in your achievement history. Your brain updates its confidence estimate with every new data point.',
    mantra: 'Confidence is not a prerequisite. It\'s a receipt — you get it AFTER the action, not before.',
  },
];

function BattlePlanCard({ plan }: { plan: BattlePlan }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn(
      "border-border overflow-hidden transition-all duration-300",
      isOpen ? `bg-gradient-to-br ${plan.gradient} shadow-lg border-l-2` : "bg-card/50 hover:bg-card border-l-2",
      `border-l-current`
    )} style={{ borderLeftColor: 'currentColor' }}>
      <button 
        className={cn("w-full text-left", plan.color)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardHeader className="flex flex-row items-center gap-4 py-5">
          <div className={cn("p-3 rounded-xl bg-muted/50 transition-transform duration-300", isOpen && "scale-110")}>
            {plan.icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-foreground">{plan.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">When your brain fights back</p>
          </div>
          <div className="pr-2 text-muted-foreground">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Feels Like */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">You&apos;ll Recognize This If...</p>
            <div className="space-y-1.5">
              {plan.feelsLike.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                  <span className="italic">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Root Cause */}
          <div className={cn("p-4 rounded-xl border", `bg-muted/20 border-border/50`)}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'inherit' }}>What&apos;s Actually Happening</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{plan.root}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest pl-1" style={{ color: 'inherit' }}>The Taskflow Playbook</p>
            {plan.actions.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black", plan.color, "border-current")}>
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">{a.action}</p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/60" />
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{a.where}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Science */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">The Science</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{plan.science}</p>
          </div>

          {/* Mantra */}
          <div className="text-center py-3">
            <p className="text-sm font-black italic text-foreground/70">"{plan.mantra}"</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <HelpCircle className="h-10 w-10 text-primary" />
          The Strategy Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Your complete guide to mastering every workflow, mechanic, and hidden feature.
        </p>
      </div>

      <Tabs defaultValue="playbook" className="space-y-6">
        <TabsList className="bg-muted border border-border p-1 h-12 w-full grid grid-cols-4">
          <TabsTrigger value="playbook" className="gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Playbook</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">Loot</span>
          </TabsTrigger>
          <TabsTrigger value="buffs" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Buffs</span>
          </TabsTrigger>
          <TabsTrigger value="world" className="gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">World</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playbook" className="space-y-4">
          {/* Start Here callout */}
          <div className="p-4 rounded-xl bg-primary/8 border border-primary/20 flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">New here? Start with The Morning Routine below.</p>
              <p className="text-xs text-muted-foreground mt-0.5">It's the spine of the entire system — every other workflow plugs into it. Read it first, then follow the daily rhythm it describes for a week before exploring the rest.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-bold text-foreground">Your operational manual.</span> Each section below is a complete workflow — tap to expand. The <span className="font-semibold text-foreground">Daily Progress Meter</span> on the dashboard tracks your combined task + chore completion as a single percentage, celebrating when you hit 100% for the day.
            </p>
          </div>
          <div className="space-y-3">
            {WORKFLOWS.map((w, i) => (
              <WorkflowCard key={w.id} workflow={w} defaultOpen={i === 0} />
            ))}
          </div>

          {/* Battle Plans Section */}
          <div className="pt-8 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <h2 className="text-xl font-black tracking-tight">Battle Plans</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                When your brain fights back — procrastination, anxiety, overthinking, motivation fade — these are tactical guides for using Taskflow&apos;s features to break through each pattern.
              </p>
            </div>
            <div className="space-y-3">
              {BATTLE_PLANS.map(p => (
                <BattlePlanCard key={p.id} plan={p} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAME_RULES.inventory.map((item) => (
              <Card key={item.name} className="bg-card border-border hover:border-primary/30 transition-all group overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-3 rounded-xl bg-muted/50 ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-muted">Consumable</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">How to Earn</p>
                    <p className="text-xs text-foreground/70 italic">"{item.earn}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="buffs" className="space-y-4">
           <div className="grid grid-cols-1 gap-4">
            {GAME_RULES.buffs.map((buff) => (
              <Card key={buff.name} className="bg-card border-border border-l-4 border-l-primary/30 hover:border-primary transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                   <div className={`p-5 rounded-2xl bg-muted/50 ${buff.color}`}>
                     <buff.icon className="h-10 w-10" />
                   </div>
                   <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3 className="text-2xl font-bold">{buff.name}</h3>
                      <p className="text-foreground/80 leading-relaxed max-w-lg">{buff.effect}</p>
                      <div className="flex items-center gap-2 pt-2 justify-center md:justify-start">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-primary italic">Trigger: {buff.trigger}</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
           </div>
        </TabsContent>

        <TabsContent value="world" className="space-y-4">
           {GAME_RULES.status.map((status) => (
              <Card key={status.name} className="bg-muted/10 border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <status.icon className={`h-6 w-6 ${status.color}`} />
                      <CardTitle>{status.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">World Logic</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-foreground/90">{status.desc}</p>
                  {status.fix && (
                    <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <RefreshCw className="h-4 w-4 text-emerald-500 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">The Antidote</p>
                        <p className="text-sm text-foreground/80">{status.fix}</p>
                      </div>
                    </div>
                  )}
                  {status.why && (
                     <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Design Rationale</p>
                        <p className="text-sm text-foreground/80">{status.why}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
           ))}

           <Card className="bg-primary border-none text-primary-foreground shadow-2xl">
             <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
                <Trophy className="h-24 w-24 opacity-80 shrink-0" />
                <div className="space-y-4">
                   <h3 className="text-3xl font-black">The Ultimate Goal: The Ancient Bonsai</h3>
                   <p className="text-lg opacity-90 leading-relaxed">
                     Every action you take in this app—every checked box, every focused minute, and every logged mistake—is fuel for your Digital Bonsai. Leveling up your tree unlocks hidden themes, rare relics, and eventually, the <strong>Ancient Bonsai stage</strong> (Level 50). 
                   </p>
                   <p className="text-sm font-bold opacity-80 uppercase tracking-widest">
                     The items in your inventory are the only way to feed it. Use them wisely.
                   </p>
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="pt-10 flex justify-center">
         <p className="text-xs text-muted-foreground italic font-medium">"Growth is not linear. It is a spiral." — The Architect</p>
      </div>
    </div>
  );
}
