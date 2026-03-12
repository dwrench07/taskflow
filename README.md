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