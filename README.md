# Dash (formerly TaskFlow)

Dash is a premium, multi-tenant productivity application designed to help users manage their time, habits, and long-term goals with absolute security and focus.

## 🚀 Key Features

- **Secure Authentication**: Industry-standard JWT-based session management using secure `HttpOnly` cookies.
- **Multi-Tenant Data Isolation**: Every user's tasks, habits, and plans are strictly private and isolated at the database level.
- **Task Management**: Create, edit, and organize tasks with priorities, status tracking, and subtasks.
- **Habit Tracking**: Build consistency by tracking daily habits and monitoring streaks.
- **Daily Planning**: A dedicated view to plan your day by selecting specific tasks and habits to focus on.
- **Modern UI**: A sleek, responsive interface built with Next.js, Tailwind CSS, and Shadcn UI.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Jose](https://github.com/panva/jose) (JWT) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)

## 🗺️ Roadmap

> **Workflow Note:** Anything actively being built should be moved to this execution list and added to a specific Phase first before building. Any newly proposed ideas should first be added under the "Future Vision & Idea Sandbox" below.

### Phase 1: Stability & Performance (Current)
- [x] Fix task and habit deletion issues.
- [x] Set Calendar default view to Day view.
- [x] Optimize MongoDB connection logic for Vercel deployments.
- [ ] Complete full TypeScript type-safety across the codebase.

### Phase 2: Focus & Productivity
- [ ] **Focus Timer**: A multi-mode timer (Pomodoro, Stopwatch, Custom) with direct integration from Tasks and Habits. Includes post-session Productivity & Energy Scoring, Deep Work multipliers, a Distraction Log, Avoidance tracking (Frog Eater badge), and a 5-Day Analytics Bar Chart.
- [x] **Timer API Integration**: Log individual timer events (start, pause, stop) via API for precise tracking of focus interruptions and to avoid losing state when navigating away/closing tabs. If tab is closed without ending, auto-end at duration limit (or switch to start time of next timer if overlapped).
- [x] **Timer Audio Cues**: Beep functionality (1 beep at 50%, 2 beeps at 80% to wind up, and 3 beeps at 100% completion).
- [ ] **Analytics Dashboard**: Enhanced charts for task completion trends, habit consistency heatmaps, and goal progress curves.
- [ ] **Template Overhaul**: Improved task templates for rapid recurring setup.

### Phase 3: Strategic Alignment & Deep Work
- [ ] **Goal Tracking**: Long-term objective management. Link habits and tasks to high-level goals.
- [ ] **Calendar Refinements & Subtask Planning**: Schedule individual subtasks to the daily plan and intuitively sort events. Includes fixes to hide duplicate parent tasks and natively display context.

### Phase 4: Custom Organization & Behavioral Insights
- [ ] **Tagging & Filtering**: Comprehensive system to label and filter all items by project, context, or area of life.
- [ ] **Habit UI Optimization**: Simplify the interface to reduce overwhelm and focus on daily consistency.
- [ ] **Daily Review & Avoidance Analytics**: A sophisticated feedback loop that identifies "yesterday's leftovers." It forces a conscious choice on unfinished tasks (Move, Push, Break, or Drop) and builds a behavioral profile of your avoidance patterns based on task categorization and effort sizing (S, M, L).
- [ ] **Activation Energy Check**: Identify pushing behaviors when tasks are marked important but lack the threshold action energy needed to start.

### Phase 5: Advanced Productivity Features (Completed)
- [x] Add "Urgent" priority level.
- [x] Implement Energy-Based Filtering for tasks.
- [x] Implement Subtask Reordering.
- [x] Add Subtask Priority and Difficulty (Energy Level) tracking.

### Phase 6: Visual Progress & Documentation
- [ ] **Progress Visualizer (Before & After)**: Capture and compare "Before", "After", and incremental "In-between" snapshots (text and images) to track long-term transformations.

### Phase 7: System Integration & Advanced Features
- [ ] **Browser Notifications**: Implement reminders for task deadlines and focus session starts.
- [ ] **Background Execution**: Support Service Workers/PWA capabilities to keep timers and sync running while the tab is inactive.
- [ ] **Sound/Alerts**: Add configurable notification sounds for session completion.

### Phase 8: Psychological Productivity Frameworks
- [ ] **Mental Model Views**: Implement dedicated views to process daily tasks using different psychological framework metrics:
    - **Eisenhower Matrix** (Urgent vs. Important quadrants).
    - **Eat the Frog Method** (Flagging and prioritizing high-resistance tasks).
    - **Parkinson's Law** (Timeboxing extensions and "fill the time" boundary matching).
- [ ] **Extensibility**: Allow users to construct and apply different scientifically-proven models depending on life category or context.

## 🏁 Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up your environment variables (see `.env.example`).
4. Run the development server: `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Strengthening Partially-Addressed Problems

> These enhancements build on features that ALREADY EXIST but don't fully solve the underlying problem. Each section lists what exists, what's missing, and the specific changes to make.

### Implementation Order

| Order | Section | What | Why This Order | Status |
|-------|---------|------|----------------|--------|
| 1 | S4 | Push Reason Tracking | Simplest data change; generates avoidance data everything else needs | ✅ Done |
| 2 | S1 | Jot Categorization | Small data model change, big payoff for anxiety tracking | ✅ Done |
| 3 | S3 | Energy Matching + Morning Launch | High daily impact; morning routine fixes cascade into #12, #13, #24 | ✅ Done |
| 4 | S2 | Self-Care Habits | Adds habit category + affirming UI; builds on energy data from S3 | ⬜ Skipped |
| 5 | S6 | Gamification (Badges, XP, Celebrations) | Reward layer on top of all previous enhancements | ✅ Done |
| 6 | S5 | Pre-Built Templates + Quick Launch | Content work + friction reduction; less urgent than data changes | ⬜ Skipped |
| 7 | S7 | Picking Behavior Awareness | Most niche; do last | ⬜ Skipped |

### S1: Jots & Back of Mind → Active Anxiety Coping (Strengthens #6, #3)

**What exists:** Jots are stored as `string[]` on focus sessions. Back of Mind has API endpoints but no UI page. No categorization on either.

**Enhancements:**
- [x] **Jot Categorization** — When adding a distraction during a focus session, offer a quick-tag: `worry` | `todo` | `idea` | `random`
  - Stored as object `{ text, category, timestamp }` instead of plain string
  - Migration: treat existing string jots as `{ text: string, category: 'untagged' }`
- [x] **Anxious Thought Follow-Up** — Jots tagged `worry` get a scheduled follow-up (7-14 days): "Did this actually happen?"
  - Builds a **Fear vs Reality** accuracy score over time on the Jots page
  - Display: "You've had 34 worried thoughts. 31 of them never happened (91%)"
  - ⚠️ Follow-up result recording UI not yet built (see Open Questions)
- [x] **Jot-to-Task Conversion** — One-click convert a `todo` jot into an actual task (pre-fills title)
- [x] **Back of Mind UI Page** — Build the missing page at `/back-of-mind`
  - Card grid sorted by relevance score
  - Filter by category
  - "Surface a random thought" button for reflection
- [x] **Jots Page Filters** — Filter by category, date range, session. Search across all jots

### S2: Habits → Self-Worth Building (Strengthens #11, #10)

**What exists:** Habits with streaks, daily status (smile/meh/frown), 30-day heatmap, streak goals with trophy icon. No distinction between productivity and self-care habits.

**Enhancements:**
- [ ] **Self-Care Habit Category** — Add `habitCategory: 'productivity' | 'self-care' | 'health' | 'emotional'` field to habits
  - Self-care habits use different framing in UI: "You took care of yourself" instead of "Task completed"
  - Separate self-care streak counter on dashboard: "5-day self-care streak"
  - Pre-suggested self-care habits on first use: ate 3 meals, dressed intentionally, 10 min outside, basic hygiene, one kind thing for yourself
- [ ] **Affirming Completion Messages** — When completing a self-care habit, show a rotating affirmation:
  - "You are worth taking care of"
  - "Your needs matter"
  - "This is not optional — you deserve this"
  - Subtle, not cheesy. Small text below the completion checkmark
- [ ] **Self-Care Score on Dashboard** — New metric card: "Self-Care Today: 3/5"
  - Separate from productivity metrics
  - Framing: not a KPI to optimize, but a minimum to protect
- [ ] **Needs Awareness Prompt** — Integrate with existing daily review modal:
  - At end of daily review, add: "Before you start — what do you need right now?" (rest, food, movement, connection, comfort)
  - Log the answer. Weekly summary: "You needed rest 6 times but only rested twice"

### S3: Energy Tagging → Smart Energy Matching (Strengthens #12, #13, #24)

**What exists:** `energyLevel` field on tasks, subtasks, chores, and focus sessions. Used only in Frogs page filtering (`urgent + high energy = frog`). No energy-based suggestions or filtering elsewhere.

**Enhancements:**
- [x] **Current Energy Check-In** — On daily plan page load (morning), prompt: "How's your energy right now?" (high / medium / low)
  - Store as daily log entry with timestamp
  - Use to filter/sort daily plan: show low-energy tasks first when energy is low
- [x] **Energy-Matched Task Suggestions** — On plan page, highlight tasks that match current energy level
  - Green border = matches your energy, yellow = slight mismatch, red = wrong time for this
  - "Your energy is low. These 3 tasks are a good fit right now:" suggestion bar
- [x] **Morning Launch Sequence** — When app opens before 10:30 AM:
  - Simplified view: just today's top 3 tasks + habits due
  - First task is always low-friction (a "warm-up" task) to build momentum
  - Optional: attach a small reward to the first morning task (dopamine primer — e.g., "Complete this, then coffee")
  - Skip the full dashboard complexity — mornings need simplicity
- [x] **Energy Pattern Tracking** — Log energy across days, chart by time of day
  - After 2 weeks: "You're consistently low-energy before 11am. Your high-energy window is 2-5pm"
  - Auto-suggest scheduling high-energy tasks in the afternoon
- [x] **Weekend vs Weekday Awareness** — Track that Saturday energy is higher (#13)
  - Different daily plan suggestions on weekends vs weekdays
  - Weekday mornings: gentler start, fewer tasks, warm-up first

### S4: Push Count → Avoidance Intelligence (Strengthens #2, #5, #17)

**What exists:** `pushCount` on tasks/subtasks. Incremented on daily review "Push" action. Displayed as red badge on Frogs page and daily review. No analytics or reason tracking.

**Enhancements:**
- [x] **Push Reason Tracking** — When pushing a task in daily review, ask "Why?":
  - Options: `too scary` | `too vague` | `too big` | `too boring` | `ran out of time` | `genuinely deprioritized`
  - Stored as `pushHistory: [{ date, reason }]` on the task
- [x] **Push Pattern Analytics** — New section on analytics dashboard:
  - "Tasks pushed 3+ times" list with common reasons
  - Chart: push reasons distribution (pie chart)
  - Insight: "You push 'too scary' tasks 4x more than 'too boring' ones — your blocker is fear, not boredom"
  - Trend: are you pushing less over time? (approach vs avoidance trajectory)
- [x] **Smart Interventions Based on Push Reason** — When a task hits push count 3+:
  - If `too scary`: suggest breaking into subtasks or using Start Assist (Phase B)
  - If `too vague`: prompt to clarify with a 5-minute "define the first step" exercise
  - If `too big`: suggest T-shirt re-sizing or splitting into subtasks
  - If `too boring`: suggest pairing with music/reward or batching with other boring tasks
- [x] **The "90% Done" Detector** (#17) — Flag tasks where:
  - Most subtasks are complete but parent isn't
  - Task has been "in-progress" for 3+ days with no subtask activity
  - Surface these separately: "Almost done — just finish these:"

### S5: Templates → Friction-Free Starts (Strengthens #2, #18)

**What exists:** User-created templates with title, description, priority, subtasks, tags, energy, size, goal/milestone linking. Quick Generate for bulk instantiation. No pre-built templates.

**Enhancements:**
- [ ] **Pre-Built Starter Templates** — Ship with templates for common high-resistance patterns:
  - "Morning Routine" (wake up → hygiene → breakfast → plan day)
  - "Deep Work Block" (close distractions → set timer → work → review)
  - "Weekly Review" (review goals → check habits → plan next week)
  - "Meal Prep" (plan meals → grocery list → cook → store)
  - "Self-Care Check" (body scan → eat → move → rest)
  - User can customize but starting from something > starting from blank
- [ ] **Template Quick-Launch from Daily Plan** — Instead of creating a task then starting it, one-click: template → task → focus session
  - Removes 3 steps of friction between deciding and doing
- [ ] **Emotional Pre-Flight on Templates** — Templates for scary tasks include a built-in first subtask: "Take 3 deep breaths and read the task description"
  - Normalizes the emotional start-up cost as part of the workflow

### S6: Streaks & Gamification → Dopamine Repair (Strengthens #25, #9)

**What exists:** Streak count with flame icon, trophy icon with pulse animation on goal met, streak goal progress bar, daily status color coding. No badges, no celebration animations, no XP, no sound.

**Enhancements:**
- [x] **Celebration Moments** — Confetti animation + optional sound on:
  - Completing a streak goal
  - Eating a frog (completing a high-resistance task)
  - Finishing all daily plan tasks
  - Hitting a milestone
  - Keep it subtle — 1-2 seconds, not obnoxious
- [x] **Achievement Badges** — Unlockable badges displayed on a profile/achievements page:
  - "First Focus" — complete first focus session
  - "Frog Eater" — complete 5 tasks with pushCount > 3
  - "Week Warrior" — complete daily plan 5 days in a row
  - "Self-Care Champion" — 7-day self-care streak
  - "Fear Crusher" — complete 3 tasks rated "dread" in emotion check-in
  - "Consistency Machine" — any habit at 21-day streak
  - "Approach Master" — 7-day approach streak (from Phase D)
  - Each badge has tiers: bronze (first), silver (10x), gold (50x)
- [x] **Daily Wins Summary** — End-of-day notification or dashboard section:
  - "Today you: completed 4 tasks, maintained a 12-day streak, ate 2 frogs, and took care of yourself"
  - Positive framing only — no guilt for what wasn't done
  - This is the dopamine hit that "effort not feeling rewarding" (#25) is missing
- [x] **XP System (Lightweight)** — Points for actions, visible on dashboard:
  - Complete task: +10 XP (scaled by T-shirt size: S=5, M=10, L=20, XL=40)
  - Complete habit: +5 XP
  - Eat a frog: +25 XP bonus
  - Focus session: +1 XP per minute
  - Approach bonus: +15 XP when completing a task with pre-task anxiety > 5
  - Weekly/monthly XP chart — the only metric that always goes up, never punishes
- [x] **Progress Sound Effects** — Subtle audio cues:
  - Soft "ding" on task completion
  - Streak milestone sound
  - Respect user preference: off by default, opt-in in settings

### S7: Frogs Page → Picking Behavior Awareness (Strengthens #20)

**What exists:** Frogs page identifies high-resistance tasks. Focus timer logs distractions. No awareness mechanism for unconscious physical habits like picking.

**Enhancements:**
- [ ] **Body Awareness Micro-Prompts** — During focus sessions, optional periodic prompt (every 15-20 min):
  - Small, non-intrusive toast notification: "Quick body check — what are your hands doing?"
  - Not a blocker — auto-dismisses after 5 seconds if ignored
  - Toggle on/off in focus session settings
  - Log responses over time to track awareness growth
- [ ] **Post-Session Body Check** — After ending a focus session, add optional question:
  - "Did you notice any picking or fidgeting during this session?" (yes/no/didn't notice)
  - Track alongside distraction score — separate "body distraction" metric
- [ ] **Awareness Streak** — Track consecutive sessions where you noticed AND stopped a picking behavior
  - Different from habit streaks — this is about building conscious awareness of unconscious actions
- [ ] **Fidget Alternatives Suggestion** — When body check is triggered:
  - Suggest: squeeze a stress ball, stretch fingers, take 3 deep breaths
  - Rotate suggestions to prevent habituation

---

## 🧠 Emotional & Psychological Resilience Features

> These features address problems #2-#11 from PROBLEMS.md — the emotional and psychological barriers that sabotage productivity even when you know what to do. They are ordered by dependency: later phases build on earlier ones.

### Phase A: Foundation — Emotion Check-In System (Addresses #2, #3, #4, #5, #6)

The single highest-leverage feature. Emotional labeling alone reduces amygdala activation by ~30% (Lieberman, UCLA). This integrates into the existing task flow.

- [x] **Pre-Task Emotion Check-In**
  - Before starting a focus session or task, prompt: "What are you feeling right now?"
  - Dropdown options: dread, anxiety, resistance, overwhelm, calm, neutral, excited
  - Body tension rating: 1-10 slider
  - Data is stored per task per session
- [x] **Post-Task Emotion Check-In**
  - After completing a focus session: "How do you feel now?"
  - Same emotion dropdown + tension slider
  - Over time, builds a dataset proving: feelings BEFORE are always worse than DURING
- [x] **Emotion Trends Dashboard**
  - Chart: pre-task anxiety vs post-task relief over time
  - Pattern detection: "You feel dread before Large tasks but calm after 80% of them"
  - Correlation: which task types, times of day, or energy levels trigger the most resistance?

### Phase B: In-the-Moment Interventions (Addresses #2, #6)

Tools to break the freeze response and anxiety spirals in real time. Accessible from anywhere in the app.

- [x] **Start Assist Flow** (for #2 — freeze response)
  - Triggers when body tension is rated 7+ in the emotion check-in
  - Step 1: 60-second guided box breathing (4-4-4-4) with visual animation
  - Step 2: "2-Minute Commit" — timer auto-starts for just 2 minutes. No pressure to continue
  - Step 3: After 2 min, gentle prompt: "Keep going?" (most people do)
  - The point: shift the nervous system BEFORE asking the brain to work
- [x] **Grounding Mode / Panic Button** (for #6 — anxiety spirals)
  - Floating button accessible from any page
  - Option 1: Guided 5-4-3-2-1 grounding (name 5 things you see, 4 hear, 3 feel, 2 smell, 1 taste)
  - Option 2: Quick thought dump — textbox to park the intrusive thought (saves to Jots with "anxiety" tag)
  - Option 3: 90-second "Surf the Urge" timer — just wait. Emotions peak at ~90s then decline naturally
  - After any option: "Ready to refocus?" links back to current task/focus session
- [ ] **Reframe Jots & Back of Mind as Anxiety Tools**
  - Add an "anxious thought" tag/category to Jots
  - When saving a jot during focus, offer: "Is this an anxious thought or an actionable idea?"
  - Anxious thoughts get a follow-up prompt later: "Did this actually happen?" (builds evidence against catastrophizing)

### Phase C: Structured Fear Processing (Addresses #3, #4)

For the bigger fears — job loss, visa, career uncertainty — that loop endlessly because the brain never reaches resolution.

- [ ] **Worry Journal**
  - Structured entry form:
    - "What am I afraid of?" (free text)
    - "Worst case scenario?" (free text)
    - "Best case scenario?" (free text)
    - "Most likely scenario?" (free text)
    - "Probability of worst case?" (1-10 slider)
    - "What can I actually control?" (free text)
  - Scheduled follow-up (2 weeks later): "What actually happened?"
  - Over months, builds a **Fear vs Reality** accuracy chart — proof your predictions are wrong 90% of the time
- [ ] **Decision Time-Boxing**
  - For ambiguous decisions that cause paralysis: set a decision deadline
  - "I will decide about X by [date]"
  - Before deadline: structured pros/cons with "good enough" framing
  - After deadline: decision is locked. No more deliberation. Track outcome for feedback
- [ ] **Uncertainty Exposure Ladder** (for #4)
  - A personal list of small-to-large uncertain situations you commit to entering
  - Examples: "Try a new restaurant without checking reviews" → "Apply to a job I'm not sure I'm qualified for"
  - Rate anxiety before (predicted) and after (actual) each exposure
  - Chart: predicted vs actual anxiety over time — builds tolerance visually

### Phase D: Emotional Pattern Training (Addresses #5, #7, #8)

Long-term rewiring of avoidance patterns. These features work over weeks/months.

- [x] **Avoidance Pattern Tracker** (for #5)
  - Integrates with existing push count and daily review
  - When a task is pushed, ask: "Why?" with options: too hard, too boring, too scary, too vague, genuinely deprioritized
  - Monthly report: "You avoided 12 tasks tagged 'too scary' — 8 of them were actually easy once started"
  - Connects avoidance reasons to emotion check-in data
- [x] **Approach vs Avoidance Score**
  - Daily metric: how many times did you approach discomfort vs avoid it?
  - Every completed focus session with pre-task anxiety > 5 = approach point
  - Every pushed task with reason "too scary" = avoidance point
  - Streak: "7-day approach streak" — more meaningful than task completion streaks
- [x] **Stretch Goal Nudges** (for #8 — aiming for minimum)
  - When creating a goal, prompt: "What would the ambitious version of this look like?"
  - Store both the "safe" goal and the "stretch" goal
  - After hitting the safe goal, surface the stretch: "You hit your target. The stretch was [X]. Want to keep going?"
  - No shame if you stop — the stretch is always optional
- [x] **Private Milestone Celebrations + Optional Share** (for #7)
  - When a goal/milestone is completed, trigger a private celebration screen
  - Show: what you achieved, how long it took, emotional journey (from check-in data)
  - Optional "Share Win" button — only appears AFTER completion, never before
  - Sharing is always opt-in, never prompted aggressively

### Phase E: Self-Awareness & Root Cause Work (Addresses #9, #10, #11)

The deepest layer. These address background unhappiness, childhood emotional neglect patterns, and self-care avoidance.

- [ ] **Mood Tracker** (for #9)
  - Quick daily check-in: mood (1-10), energy (1-10), one word for the day
  - Optional: what contributed? (sleep, food, exercise, social, work)
  - Weekly trend chart with correlations: "Your mood is 2 points higher on days you exercise"
  - Not a replacement for therapy — but makes invisible patterns visible
- [ ] **Needs Check-In** (for #10 — CEN)
  - Periodic prompt (2-3x/day): "What do you need right now?"
  - Options: rest, food, connection, movement, comfort, stimulation, nothing
  - The point: people with CEN are disconnected from their own needs. The prompt trains awareness
  - Weekly summary: "You needed rest 8 times but only acted on it twice"
  - Gentle nudges, never guilt
- [ ] **Self-Care Streaks** (for #11)
  - Dedicated self-care habit category separate from productivity habits
  - Track: ate 3 meals, dressed well, basic hygiene, 10 min outside, one kind thing for yourself
  - Different framing: not "productive habits" but "you are worth taking care of"
  - Celebration: "You took care of yourself 5 days in a row"

### Micro-UX: Workflow Friction Fixes

Small improvements to the daily workflow that compound over time. These shape whether the app *pulls* you into action or makes you think about what to do.

- [ ] **Task Selector on Focus Page** — Currently if you land on `/focus` without a task pre-selected, you can only type a free-text goal. Add a task picker/dropdown so you can browse and select from your tasks without leaving the page.
- [ ] **"What's Next?" Post-Session Suggestion** — When a focus session ends, suggest the next task to work on (based on energy, priority, today's plan). Right now the session just ends and you navigate yourself.
- [ ] **Global Quick-Add (Ctrl+K)** — A command palette or floating button accessible from any page for instant task capture. The Command UI component already exists but is unused.
- [ ] **Clickable Tasks on Dashboard** — Summary cards (frogs, urgent, tasks today) show task names but you can't click them to jump into a focus session. One-click start from the dashboard.

### Root Cause Trackers

These directly attack the problems (#21, #22, #23, #9) that cascade into everything else — brain fog, low energy, procrastination, and mood.

- [ ] **Sleep Tracker** (for #23) — Bedtime/wake logging, nap tracking, sleep debt visualization. Broken sleep causes morning grogginess (#12, #13), brain fog (#24), and worsens focus (#14) and procrastination (#1).
- [ ] **Meal & Weight Tracker** (for #21, #22) — Daily weight log + simple did-you-eat tracking. Being underweight causes brain fog (#24), low energy, and worsens everything. Can tie into existing chores/habits infrastructure.
- [ ] **Mood Tracker** (for #9) — Quick daily check-in: mood (1-10), energy (1-10), one word for the day. Optional: what contributed? (sleep, food, exercise, social, work). Weekly trend chart with correlations. The connective tissue — once you have sleep + food + mood data, you can see what actually helps.

---

## 🔮 Future Vision & Idea Sandbox

> **⚠️ CAUTION: The Brainstorming Rule**
> Many of these concepts—especially the Goals feature and Life Architecture—require significant thought to get right. Do not build them immediately. 
> The process must be: **Brainstorm, leave it for one day to brew, and then implement.**
> Once an idea is ready to be built, it **MUST** be moved out of this sandbox and into the Roadmap execution phases above before any code is written.

This section serves as a brainstorming space for future enhancements to Dash.

### 🧠 Cognitive Load & Action Clarity
* **The 1-Second / 5-Minute Rule:** "I should be able to figure out what I am supposed to do at that particular minute in less than 1 second or I should stick to some way of looking at the app like I must 5 minutes to clearly understand etc. Something and only one or two ways of reading. This is because if the app is going to take 10 minutes to understand but if I spend, 5 seconds, I will find it painful to use the app."

### 🕸️ Interest Mapping & Prioritization
* **Massive Interest Graphs:** "I have 100s of interests so for me to be very productive, I should somehow be able to map these. This will in a way make it very clear which is connected to what and how to prioritize them."

### 📊 Analytics & Dashboards
* **Morning Dashboard:** Clear picture of where you are at the start of the day. Motivation, insights, and upcoming deadlines.
* **Evening Dashboard:** Clear picture of what was accomplished today.
* **Widget Organization:** Rethink the widget layout on the dashboard. Move upcoming deadlines to the top.
* **Two-Tier Dashboard System:** Consider a simple "numbers-only" view pulling a sidebar vs a separate full details page to avoid feeling overwhelmed.
* **Habit Streaks:** Better highlight active streaks, specifically counting how many are > 2 days.

### 🧠 Focus & Insights
* **Fix View Jots:** Fix the broken functionality for viewing Jots.
* **Guided Journaling:** Weekly reflection prompts tied to focus sessions and daily plan completions.
* **AI Distraction Analysis:** Processing the "Jots" from focus sessions to identify common internal/external triggers and suggest environment changes.
* **Focus Timer Resilience:** Fix the timer state dropping when navigating away (Persist active timer and jots locally or via service).

### 🎯 Task Management
* **Child Task Deadlines:** Track and display child task deadlines alongside parent tasks to monitor if projects are going as planned.
* **Subtask Hierarchy & Context:** Display the parent task name on subtask items for context instead of duplicating the main task. This should be displayed in reverse order (e.g., `Subtask Name — Parent Task Name`).
* **One-time Tasks / Chores:** Figure out how and where to organize simple one-off tasks (like "buy milk") so they don't clutter up the main workflow.
* **Standalone Challenges:** System for arbitrary challenges (e.g., "Focus 6 hours straight", "Random test on weekly learnings") that don't fit into standard tasks.
* **JSON Import Tool:** Build an import feature accepting raw JSON payloads, allowing users to easily generate and import complex tasks, habits, or templates via LLMs.
* **"Back of Mind" Repository:** A dedicated space for long-term thoughts and topics that are easily forgotten but should heavily influence major decisions.
* **Mistake & Feedback Tracking:** A log for personal mistakes and external feedback. Build a mechanism to incorporate the feedback and visually demonstrate to users/stakeholders how the change was applied.
* **Strategic Execution Framework:** A deliberate UI step before task execution that forces the user to think *strategically* about how to accomplish a task efficiently, rather than blindly jumping in.

### 🧗 Goal Tracking & OKRs (Strategic Alignment)
*   **Goal Standing Visualization:** Find a way to clearly show where you stand currently in different aspects of your goals without being overwhelming.
*   **Milestones / OKRs Structure:** Break down high-level, abstract goals into quantifiable, timeline-based metrics.
*   **Vision Board:** A Pinterest-style board for Life Pillars (Health, Wealth, Relationships, etc.) to visually motivate long-term objectives.
*   **Goal-to-Task Linkage:** Enforce strict links so that executing a daily task visually fills up the progress bar of its parent Goal.
*   **Quarterly Goal Review:** A dedicated feature to stop daily execution and force a review of the big picture every quarter.

### 🏆 Gamification
* **Gratification & Rewards:** The concept of unlocking things (badges, milestones, or other rewards) as you progress. The goal is to make life interesting and provide motivation.
* **Badges:** Streaking mechanics for consistent daily habit completion.

### Task Architecture & Granularity Strategy

#### 1. Tasks vs. Chores (The "Small Task" Problem)
If a user creates 100 small tasks (e.g., "Clean the house", "Buy milk"), these quickly drown out the large, high-impact tasks (e.g., "Write the business plan").
*   **The Routine Solution:** Small, repetitive actions should ideally be driven into the **Habits** pipeline if they recur, or grouped into a single "Life Admin / Chores" super-task. Subtasks within "Life Admin" can hold the granular items.
*   **The T-Shirt Sizing Approach:** Implementing an Effort/Impact matrix (S, M, L, XL) at the Task level. You can filter the view to "Only show M and L tasks" when plotting out deep work, hiding the small chores.

#### 2. Advanced Task Dependencies
How to handle complex relationships where Task A depends on Task B and C.
*   **Sequential Chaining (A -> B -> C):** "B" is locked and hidden from the daily view until "A" is marked complete.
*   **Parent-Child Blocking (B & C -> A):** Task A is the overarching project. It cannot be marked "Complete" until both standalone tasks B and C are completed.
*   **Implementation Idea:** Add a `blockedBy: TaskId[]` array to the data model. When rendering the task list, a toggle can visually gray out or completely hide tasks that are currently blocked.

# Life Management System Strategy

When we are ready to evolve TaskFlow into a Life Management System, we should tackle it in three distinct phases to ensure the database schema can support the new features without breaking existing data.

## Phase 1: The Core Architecture (Data & Pillars)
Before building new UI, we need to restructure how data is stored to support complex relationships.

1. **Introduce `Goal` vs `Project` vs `Task` Types:**
   * **Goal:** The North Star (e.g., "Get Fit").
   * **Project:** A measurable objective toward the goal (e.g., "Run a 5K").
   * **Task:** The specific action (e.g., "Buy running shoes").
2. **Add `Life Pillars`:** Create a new collection (or schema definitions) for the highest-level categories (Health, Wealth, etc.).
3. **Implement Dependency Arrays:** Add `blockedBy: TaskId[]` and `blocks: TaskId[]` arrays to the Task model.

## Phase 2: The Alignment Engine (Dependencies & Viz)
With the data layer secure, we build the logic that enforces the rules.

1. **Dependency Logic:** Write the backend/frontend validation that prevents a Task from being marked "Complete" if its `blockedBy` array contains unfinished tasks.
2. **Visual Indicators:** Update the UI to visually fade, hide, or "lock" blocked tasks.
3. **Tree/Chain Visualization:** Build a new view (perhaps using a library like React Flow) to let you see your goals and how tasks cascade down from them.

## Phase 3: Analytics & Review (The OKR Feedback Loop)
Finally, we build the systems that tell you if you're actually succeeding.

1. **Alignment Scoring:** Aggregate the time spent on tasks and map them back to their parent Life Pillars. Are you spending 80% of your time on "Health" when you claimed "Wealth" was your top priority?
2. **The Avoidance Tracker Re-run:** Use the new "T-Shirt Sizing" (S, M, L) to build the behavioral profile we discussed earlier (Do you always push "Large" tasks to tomorrow?).
. **Quarterly Review UI:** A dedicated dashboard for reviewing OKR progress at a high level, rather than managing daily tasks.

---

## ❓ Open Questions

> Decisions to make before moving forward. Come back to these.

1. **S1: Worry follow-up mechanism** — Should we add a "Did this actually happen?" button on each worry jot in the Jots page? The `followUpResult` field is already typed (`happened | didnt-happen | partially`) but needs a UI to record it. This would complete the Fear vs Reality score loop. Alternative: a scheduled prompt that surfaces old worry jots after 14 days.