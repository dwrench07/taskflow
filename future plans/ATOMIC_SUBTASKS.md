# Atomic Subtasks Overhaul

## Problem

The current model treats `Task` as the primary unit and `Subtask` as a lightweight child:

- `Task` carries the rich fields: status, notes, scheduling, blocks/blockedBy, habit data, goal/milestone link, push history, t-shirt sizing, frog flag, time limit, energy, do-date, etc.
- `Subtask` is a near-duplicate but slimmer — it has its own scheduling/priority/energy/push/frog/timeLimit, but no `status` (only `completed: boolean`), no notes, no dependency graph, no goal link.

In practice the **subtask** is what gets *done* in a focus session, dragged onto the calendar, pushed, frogged, and timeboxed. The wrapping `Task` is acting more like a project / parent / container. We've ended up with two parallel feature sets and the smaller one keeps drifting to match the bigger one.

Goal: **flip the model so the subtask is the atomic unit of work**, and the parent becomes an explicit container.

## Target Model

Rename for clarity:

- `Task` (current) → `Project` (or `Initiative`, `Parent` — pick one; "Project" is most familiar).
  - A container. Owns title, description, goal/milestone link, tags, habit metadata if it's a habit-style container, ordering. **No status of its own** — its status is derived from its children.
- `Subtask` (current) → `Task`.
  - The atomic unit. Owns everything that gets *acted on*: status, priority, energy, do-date, start/end, notes, blocks/blockedBy, push history, timeLimit, t-shirt size, isFrog, completedAt.
  - Optional `projectId` (nullable — a Task can exist on its own, no parent needed).

Concretely, after the overhaul:

```ts
interface Task {              // was Subtask
  id: string;
  projectId?: string;         // null = standalone
  title: string;
  description?: string;       // promoted from notes
  status: Status;             // promoted from boolean `completed`
  priority: Priority;
  energyLevel?: EnergyLevel;
  startDate?: string;
  endDate?: string;
  doDate?: string;
  completedAt?: string;
  tags?: string[];
  notes?: string[];
  blocks?: string[];
  blockedBy?: string[];
  goalId?: string;            // tasks can link directly to goals too
  milestoneId?: string;
  pushCount?: number;
  pushHistory?: PushHistoryEntry[];
  timeLimit?: number;
  tShirtSize?: 'S' | 'M' | 'L' | 'XL';
  isFrog?: boolean;
  order?: number;
}

interface Project {           // was Task
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  goalId?: string;
  milestoneId?: string;
  order?: number;
  // habit fields stay here because a habit IS the container
  isHabit?: boolean;
  habitFrequency?: HabitFrequency;
  completionHistory?: string[];
  streak?: number;
  streakGoal?: number;
  shieldedDates?: string[];
  dailyStatus?: DailyStatus[];
  isPrivate?: boolean;
}
```

Derived on read:
- `Project.status` = roll-up of child statuses (all done → done, any in-progress → in-progress, all todo → todo, all abandoned → abandoned).
- `Project.progress` = % of children done.

## Why this is worth it

- One source of truth for "what's a unit of work." No more deciding whether to add a new field to `Task`, `Subtask`, or both.
- Calendar, focus sessions, push tracking, frogs, timeLimit adherence all already operate at subtask granularity — they just have to walk a `task.subtasks` array. After: they query Tasks directly.
- Standalone tasks (no project) become a first-class concept instead of a one-subtask-task hack.
- Templates, dashboards, and analytics simplify: stop double-counting between the two layers.

## Migration — high-level phases

**Phase 0 — decide naming.** Lock the rename (`Task → Project`, `Subtask → Task`) before touching code, because every file reference flips. Alternative: keep `Task` as the atomic name and rename the parent only — slightly less churn but more confusing during the transition because existing `Task` callsites change semantics silently.

**Phase 1 — type & data layer.**
- Rewrite `src/lib/types.ts` to the target model.
- Write a one-shot migration in `src/lib/database/` that, for every existing `Task`:
  - Creates a `Project` from the parent fields.
  - Promotes every `Subtask` to a `Task` with `projectId = parent.id`, copying the parent's goalId/milestoneId/tags as defaults if the subtask doesn't have its own.
  - If a parent had no subtasks, create a single child `Task` from the parent's action-fields so nothing is orphaned.
- Update the in-memory and Mongo adapters. Keep the old shape readable for one release so you can roll back.

**Phase 2 — services & queries.**
- `src/lib/data-service.ts`: replace `getTasks()` / `subtask` traversals with `getTasks({ projectId? })` and `getProjects()`.
- Add a `getProjectWithTasks(id)` helper for views that want the container + children.
- Roll-up helpers: `deriveProjectStatus(tasks)`, `deriveProjectProgress(tasks)`.

**Phase 3 — UI surfaces.** This is the biggest bucket. Touch list at the end of this doc. Order them by dependency:
1. `task-form.tsx` → split into `task-form` (atomic) and `project-form` (container). Most fields move to task-form.
2. `src/app/tasks/page.tsx` (72 subtask refs) — the main list. Show tasks flat, group-by-project as a view option.
3. `src/app/calendar/page.tsx` (19 refs), `src/app/page.tsx` (17), `src/app/templates/page.tsx` + `template-form.tsx` (20 combined).
4. Dashboard widgets that count subtasks: `dashboard-summary-subtasks`, `-almost-done`, `-frog-completion`, `-overdue-risk`, `-push-analytics`, `-stats`, `-timelimit-adherence`, `-daily-wins`. Each becomes a count over the new `Task` collection — usually a *simplification*.
5. Habits page — habits stay project-shaped (the parent owns the streak), just stop pretending they have subtasks.
6. Frogs / focus / templates — flow through naturally once the type rename lands.

**Phase 4 — cleanup.**
- Delete the old `Subtask` interface and `TemplateSubtask`.
- Update `src/lib/widget-descriptions.ts` and `src/app/guide/page.tsx` copy.
- Drop the back-compat read path from the adapters once the migration has run on prod data.

## Open questions to resolve before starting

1. **Naming.** "Project" vs "Initiative" vs keep "Task" for the parent and rename the child to "Step" / "Action". Pick one; it shapes every label in the UI.
2. **Standalone tasks.** Should the UI default to "create a task" (no project) or "create a project, then tasks inside"? Current UX implies the latter — flipping it is part of the value but is a behavior change.
3. **Habits.** Confirm habits stay at the project level. (My recommendation: yes — a habit's streak is a property of the recurring container, not any one occurrence.)
4. **Goals/milestones.** Allow tasks to link to goals directly, or only via their project? Direct link is more flexible but means two paths to roll up.
5. **Templates.** A template currently produces a Task + Subtasks. After: a template produces a Project + Tasks. Same shape, just renamed — but worth confirming templates can also produce a single standalone Task with no project.
6. **Notes & description.** Subtasks currently have neither. Promote both, or just description?

## Files that will change (from current grep — 27 files, ~199 references)

Heavy hitters:
- `src/app/tasks/page.tsx` (72)
- `src/app/calendar/page.tsx` (19)
- `src/app/page.tsx` (17)
- `src/app/templates/page.tsx` + `src/components/template-form.tsx` (20)
- `src/lib/gamification.ts` (11)
- `src/app/profile/page.tsx` (8)
- `src/app/guide/page.tsx` (10)
- `src/components/dashboard-almost-done.tsx` (8)

Plus the whole `dashboard-*` cluster and the data layer (`types.ts`, `data-service.ts`, `database/in-memory-adapter.ts`, `pages/api/templates.ts`).

## Suggested first concrete step

Write the new types in `src/lib/types.ts` *alongside* the old ones (e.g. `TaskV2`, `ProjectV2`), build the migration script, and run it against a copy of local data. Verify the rollup-derived project status matches what the UI shows today. Only then start swapping callsites.

---

## Implementation status (Phase A landed)

The foundation has been refactored and the project builds clean (`npm run typecheck` and `npm run build` both pass). Old UI continues to work via documented `@deprecated` shims so the app stays usable while UIs migrate.

### Done

- `src/lib/types.ts` — new `Project` (container) + atomic `Task` with `category` (`project-work | chore | habit`) and `recurrence` (`once | daily | weekly | monthly | custom`). Old `Subtask`, `Chore`, `HabitFrequency`, `ChoreFrequency`, `TemplateSubtask`, `lastCompleted`, `frequency`, `completedOnce`, `subtasksCompleted`, `isHabit`, `habitFrequency`, `priority` (on TaskTemplate) kept as deprecated aliases.
- `src/lib/database/types.ts` — added `getAllProjects/getProject/addProject/updateProject/deleteProject`. Removed Chore methods from the interface. `chores` collection key kept optional for back-compat.
- `src/lib/database/in-memory-adapter.ts` — Project CRUD added; Chore methods removed; mock data uses new shape.
- `src/lib/database/mongodb-adapter.ts` — Project CRUD added; Chore methods removed; cascade unsets `projectId` on child Tasks when a Project is deleted; new indexes on `tasks.projectId`, `tasks.category`, `tasks.recurrence`, `tasks.doDate`, `projects.userId`, `projects.goalId`.
- `src/lib/data-service.ts` — Project CRUD (`getAllProjectsAsync`, `getProjectAsync`, `getProjectWithTasksAsync`, `addProjectAsync`, `updateProjectAsync`, `deleteProjectAsync`), `getTasksByProjectAsync`, plus rollup helpers `deriveProjectStatus(tasks)` and `deriveProjectProgress(tasks)`. Chore CRUD removed.
- `src/lib/data.ts` — client API for Projects (`getAllProjects`, `addProject`, `updateProject`, `deleteProject`). Chore client functions kept as deprecated wrappers that route to Tasks where `category === 'chore'`.
- `src/pages/api/projects/index.ts` and `src/pages/api/projects/[id].ts` — new REST endpoints. `src/pages/api/chores/{index,[id]}.ts` deleted.
- `src/lib/habits.ts` — `calculateStreak` reads `task.recurrence` instead of the dropped `habitFrequency`.
- `src/lib/gamification.ts` — `isHabit`/`isOneTime` helpers; XP, badges, daily wins all use `category`/`recurrence`. "The Closer" rule rewritten to fire when this Task closes the last open one-time sibling in its Project (uses `task.projectId` and `allTasksOnLoad`).
- `src/lib/config.ts` — added `projects` and `userProgress` collection keys; removed required `chores` key.
- `src/app/chores/page.tsx` — fully rewritten to query Tasks where `category === 'chore'`, supports both one-time (status flip) and recurring (completionHistory append) chores.
- `src/pages/api/templates.ts` — mock template data uses the new `tasks: TemplateTaskSpec[]` shape.

### Not yet migrated (still works via shims, but on the old model semantically)

These surfaces still read/write the legacy `task.subtasks`, `task.isHabit`, `task.habitFrequency`, etc. They compile, but do not yet expose the new model to the user.

- `src/components/task-form.tsx` — no `category` / `recurrence` pickers yet. Should be split into `task-form` (atomic) + `project-form` (container).
- `src/app/tasks/page.tsx` — still subtask-list UX. Quick-capture flow not built. No grouping by Project. Templates section still uses `template.subtasks` instead of `template.tasks`.
- `src/app/page.tsx` (dashboard) — `isHabit` / `subtasks` / chore-derived counts in a few places; the chore mini-section uses legacy `lastCompleted`/`frequency`.
- `src/app/calendar/page.tsx` — legacy `parent.subtasks` traversal for nested events; isHabit checks.
- `src/app/templates/page.tsx` + `src/components/template-form.tsx` — template editing/instantiation still produces a Task with `subtasks: [...]`. Should produce a Project + Tasks (or a single standalone Task).
- `src/app/habits/page.tsx` — creates Tasks with `isHabit: true` + `habitFrequency`. Should set `category: 'habit'` + `recurrence`. Filters habits by `isHabit`.
- `src/app/frogs/page.tsx`, `src/app/focus/page.tsx`, `src/app/profile/page.tsx`, `src/app/jots/page.tsx`, `src/app/plan/page.tsx` — small `isHabit` / `subtasks` / `lastCompleted` references.
- Dashboard widget cluster — `dashboard-almost-done`, `dashboard-blocker-insights`, `dashboard-chart`, `dashboard-completion-chart`, `dashboard-daily-wins`, `dashboard-frog-completion`, `dashboard-goal-coverage`, `dashboard-habit-heatmap`, `dashboard-habit-resilience`, `dashboard-overdue-risk`, `dashboard-overview`, `dashboard-pillar-balance`, `dashboard-timelimit-adherence`. Each still queries via `isHabit`/`subtasks`. Should use `category === 'habit'` and stop counting subtasks (always 0 now).
- `src/components/morning-launch.tsx` — `lastCompleted`/`frequency` on chore-style tasks.
- `src/components/daily-review-modal.tsx` — `isHabit` filter.
- `src/lib/widget-descriptions.ts` and `src/app/guide/page.tsx` — copy still mentions subtasks.
- `src/app/globals.css` — one stale class name reference.

### Phase B status (landed)

Phase B made the new model the live system. Build still green (`npm run typecheck` and `npm run build` pass).

- **`task-form.tsx`** — added `category` (project-work / chore / habit), `recurrence` (once / daily / weekly / monthly / custom), `intervalDays` (custom), and `projectId` pickers. Defaults preserve existing behaviour.
- **`project-form.tsx`** — new lightweight form for Project create/edit (title, description, tags, goal, milestone).
- **`tasks/page.tsx`** — quick-capture input added above the grid (title only → safe defaults: medium/project-work/once). Form submit handler now passes through `category`/`recurrence`/`projectId`/`intervalDays` and converts `"none"` sentinel values to `undefined`.
- **`templates/page.tsx`** — instantiation rewritten: 0–1 child template specs → a single standalone Task; 2+ → a new Project with each spec as a child Task. Falls back to legacy `subtasks` if `tasks` array is empty.
- **`template-form.tsx`** — mirrors edited subtasks into the new `tasks: TemplateTaskSpec[]` shape on save so instantiation produces the right structure.
- **`habits/page.tsx`** — habit create/update sets `category: 'habit'` + `recurrence` (and dual-writes the legacy `isHabit`/`habitFrequency` for any unmigrated reads). The form's frequency default reads `recurrence` first, then falls back to `habitFrequency`. Habit list filter accepts either field.
- **`chores/page.tsx`** — already on the new model (queries `category === 'chore'`); now also dual-writes the legacy `frequency` and `lastCompleted` fields so the dashboard's chore mini-section keeps rendering correctly.
- **`calendar/page.tsx`** — `handleCreateTask` now sets `category` + `recurrence` defaults. Subtask traversal still present but operates on always-empty arrays (effectively no-ops in the new model).
- **`jots/page.tsx`** — convert-to-task path sets `category` + `recurrence`.
- **Dashboard widgets** — habit/non-habit filters in roughly half the widgets now read `category === 'habit'`; the rest still read `isHabit` (the dual-write keeps them correct). Notable rewrites:
  - `dashboard-almost-done.tsx` — now tracks **Project** progress (60%+ complete via child-task ratio), not subtask progress.
  - `dashboard-summary-subtasks.tsx` — now lists today's scheduled child-Tasks-of-a-Project (the spiritual successor to "subtasks scheduled today"). Component export name preserved.
  - `dashboard-overdue-risk.tsx` — "Large, not broken down" risk factor now flags `tShirtSize >= L` standalone Tasks (no `projectId`) instead of subtask-less Tasks.
- **Widget descriptions** — `almost-done` and `daily-wins` copy updated to reflect the new model.

### Still on the legacy path (intentional — non-breaking, deferred)

These read `isHabit` / `frequency` / `lastCompleted` / `subtasks` directly, but produce correct output because of the dual-writes. Migrate when convenient:

- `src/app/page.tsx` (dashboard) — chore mini-section uses `c.frequency` and `c.lastCompleted`. Plan view uses `t.isHabit` and `task.subtasks`.
- `src/app/calendar/page.tsx` — `e.isHabit` checks in 3 spots; `event.isSubtask` branches throughout (always false now).
- `src/app/plan/page.tsx` — `c.frequency`, `c.lastCompleted`, `c.completedOnce` for chores.
- `src/app/focus/page.tsx`, `src/app/frogs/page.tsx`, `src/app/profile/page.tsx`, `src/components/morning-launch.tsx`, `src/components/daily-review-modal.tsx`, `src/components/template-form.tsx` — small `isHabit` / `subtasks` reads.
- ~10 dashboard widgets that still use `t.isHabit` (correct via dual-write).
- `src/app/guide/page.tsx` — copy describes the old subtask flow. Pure documentation; no runtime impact.

### Final cleanup (drop the shims)

When all reads above have been migrated:

1. Remove the dual-write fields from habit creation in `src/app/habits/page.tsx` (`isHabit: true`, `habitFrequency: ...`).
2. Remove the dual-write fields from chore creation/update in `src/app/chores/page.tsx` (`frequency: ...`, `lastCompleted: ...`).
3. Drop the deprecated fields from `src/lib/types.ts`: `Subtask`, `Chore` alias, `HabitFrequency`, `ChoreFrequency`, `TemplateSubtask`, and on `Task`: `subtasks`, `notes` (or keep), `isHabit`, `habitFrequency`, `frequency`, `lastCompleted`, `completedOnce`. On `TaskTemplate`: `subtasks`, `priority`, `energyLevel`, `tShirtSize`. On `DailyWins`: `subtasksCompleted`.
4. Drop the `Chore` wrapper functions from `src/lib/data.ts` (`getAllChores`, `addChore`, `updateChore`, `deleteChore`).
5. Drop the `chores` collection key from `DatabaseConfig`.
6. Update `src/app/guide/page.tsx` copy to describe the Project + atomic Task model.

### Recommended migration order for Phase B

1. **`task-form.tsx` split + `tasks/page.tsx` quick-capture** — highest user value, demonstrates the new model end-to-end.
2. **`templates/page.tsx` + `template-form.tsx`** — switch to `tasks: TemplateTaskSpec[]`, drop the `subtasks`/`priority` fields on the template root.
3. **`habits/page.tsx`** — rewrite habit creation to set `category: 'habit'` + `recurrence`; read habits via `category === 'habit'` filter.
4. **Dashboard widgets** — bulk replace `t.isHabit` → `t.category === 'habit'`. Drop subtask counters or repoint to "tasks with `projectId`" counts.
5. **`calendar/page.tsx`** — events are now flat Tasks; remove the parent/subtask traversal.
6. **Cleanup pass** — once no readers remain, delete the deprecated fields from `types.ts` (`Subtask`, `Chore` alias, `HabitFrequency`, `subtasks`, `isHabit`, `habitFrequency`, `frequency`, `lastCompleted`, `completedOnce`, `subtasksCompleted` on DailyWins, `priority`/`subtasks`/`energyLevel`/`tShirtSize` on TaskTemplate) and the legacy chore wrappers in `data.ts`.

### Key invariants to preserve while migrating

- `Task.subtasks` always defaults to `[]` (required field but legacy-empty). New code should not read or write it.
- `Task.notes` defaults to `[]`.
- `Task.category` defaults to `'project-work'` when omitted; `Task.recurrence` defaults to `'once'`.
- `Project` status/progress is **derived**, not stored — use `deriveProjectStatus()` and `deriveProjectProgress()`.
- Chores are Tasks with `category: 'chore'`. Habits are Tasks with `category: 'habit'`.
- Standalone Tasks (no `projectId`) are first-class — don't auto-create a Project to host them.
