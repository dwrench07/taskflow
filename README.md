# TaskFlow

TaskFlow is a premium, multi-tenant productivity application designed to help users manage their time, habits, and long-term goals with absolute security and focus.

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

### Phase 1: Stability & Performance (Current)
- [ ] Fix task and habit deletion issues.
- [ ] Set Calendar default view to Day view.
- [ ] Optimize MongoDB connection logic for Vercel deployments.
- [ ] Complete full TypeScript type-safety across the codebase.

### Phase 2: Focus & Productivity
- [ ] **Focus Timer**: A new dedicated tab to track deep work intervals (Pomodoro-style) linked to specific tasks or habits.
- [ ] **Analytics Dashboard**: Enhanced charts for task completion trends, habit consistency heatmaps, and goal progress curves.
- [ ] **Template Overhaul**: Improved task templates for rapid recurring setup.

### Phase 3: Strategic Alignment & Deep Work
- [ ] **Goal Tracking**: Long-term objective management. Link habits and tasks to high-level goals.
- [ ] **Focus Mode / Distraction Log**: Minimal interface to capture distracting thoughts during sessions for later review.

### Phase 4: Custom Organization & Behavioral Insights
- [ ] **Tagging & Filtering**: Comprehensive system to label and filter all items by project, context, or area of life.
- [ ] **Habit UI Optimization**: Simplify the interface to reduce overwhelm and focus on daily consistency.
- [ ] **Daily Review & Avoidance Analytics**: A sophisticated feedback loop that identifies "yesterday's leftovers." It forces a conscious choice on unfinished tasks (Move, Push, Break, or Drop) and builds a behavioral profile of your avoidance patterns based on task categorization and effort sizing (S, M, L).

### Phase 5: Visual Progress & Documentation
- [ ] **Progress Visualizer (Before & After)**: Capture and compare "Before", "After", and incremental "In-between" snapshots (text and images) to track long-term transformations.

## 🏁 Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up your environment variables (see `.env.example`).
4. Run the development server: `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
