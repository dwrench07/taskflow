import type { Task, TaskTemplate } from './types';

// Mock data until we have a proper DB
let allTasks: Task[] = [
  {
    id: "task-1",
    title: "Design new homepage",
    description: "Create mockups and a prototype for the new homepage design.",
    priority: "high",
    status: "in-progress",
    tags: ["design", "website", "ux"],
    startDate: "2024-08-01T10:00:00.000Z",
    endDate: "2024-08-10T17:00:00.000Z",
    subtasks: [
      { id: "sub-1-1", title: "Create wireframes", completed: true, tags: ['design'] },
      { id: "sub-1-2", title: "Develop high-fidelity mockups", completed: false, tags: ['design'] },
      { id: "sub-1-3", title: "Prototype interactions", completed: false },
    ],
    notes: ["Initial meeting with stakeholders went well. They prefer a clean, modern look."],
  },
  {
    id: "task-2",
    title: "Develop API for user authentication",
    description: "Build and document the API endpoints for user sign-up, sign-in, and profile management.",
    priority: "high",
    status: "todo",
    tags: ["development", "backend", "api"],
    startDate: "2024-08-05T09:00:00.000Z",
    endDate: "2024-08-15T18:00:00.000Z",
    subtasks: [
      { id: "sub-2-1", title: "Set up database schema for users", completed: false },
      { id: "sub-2-2", title: "Implement JWT generation", completed: false, tags: ['auth'] },
      { id: "sub-2-3", title: "Create sign-up endpoint", completed: false },
      { id: "sub-2-4", title: "Create sign-in endpoint", completed: false },
    ],
    notes: [],
  },
  {
    id: "task-3",
    title: "Plan Q4 Marketing Campaign",
    description: "Outline the strategy, channels, and budget for the upcoming Q4 marketing campaign.",
    priority: "medium",
    status: "todo",
    tags: ["marketing", "planning", "strategy"],
    startDate: "2024-08-12T09:00:00.000Z",
    subtasks: [],
    notes: ["Focus on social media and content marketing.", "Need to coordinate with the sales team for promotions."],
  },
  {
    id: 'habit-1',
    title: 'Daily Standup Meeting',
    description: 'Attend the daily team standup.',
    priority: 'medium',
    status: 'in-progress',
    isHabit: true,
    habitFrequency: 'daily',
    streakGoal: 5,
    tags: ['team', 'meeting'],
    completionHistory: ['2024-08-01T00:00:00.000Z', '2024-08-02T00:00:00.000Z'],
    dailyStatus: [
      { date: '2024-08-01T00:00:00.000Z', status: 'changes observed' },
      { date: '2024-08-02T00:00:00.000Z', status: 'no changes' },
    ],
    subtasks: [],
    notes: [],
  },
  {
    id: 'habit-2',
    title: 'Weekly Review',
    description: 'Review the past week and plan the next.',
    priority: 'low',
    status: 'todo',
    isHabit: true,
    habitFrequency: 'weekly',
    streakGoal: 4,
    tags: ['planning'],
    completionHistory: [],
    dailyStatus: [],
    subtasks: [],
    notes: [],
  }
];

let allTemplates: TaskTemplate[] = [
  {
    id: "template-1",
    title: "New Employee Onboarding",
    description: "A standard checklist for onboarding a new team member.",
    priority: "medium",
    tags: ["hr", "onboarding"],
    subtasks: [
      { id: "tsub-1-1", title: "Set up hardware (laptop, monitor)", tags: ["it"] },
      { id: "tsub-1-2", title: "Grant access to required systems", tags: ["it", "security"] },
      { id: "tsub-1-3", title: "Schedule team introduction meeting" },
    ]
  }
]

let dailyPlan: string[] = ['task-1'];

// Consolidated CouchDB state and helpers (single declaration)
let couchUrl: string | undefined = undefined;
let useCouch = false;
let nanoClient: any = null;
let tasksDb: any = null;
let templatesDb: any = null;
let metaDb: any = null;

// NEW: allow configuring / overriding DB names (env vars supported)
// Replace incorrect/locked-in initialization with proper env reads
let tasksDbName: string | undefined = "tasks" //typeof process !== 'undefined' ? process.env.COUCHDB_TASKS_DB : undefined;
let templatesDbName: string | undefined = "templates" //typeof process !== 'undefined' ? process.env.COUCHDB_TEMPLATES_DB : undefined;
let metaDbName: string | undefined = "meta"//typeof process !== 'undefined' ? process.env.COUCHDB_META_DB : undefined;

/**
 * Configure DB names at runtime. Call early (server startup) if you use custom DB names.
 * Example: configureDbNames({ tasks: 'task-flow' })
 */
export function configureDbNames(names: { tasks?: string; templates?: string; meta?: string }): void {
  if (names.tasks) tasksDbName = names.tasks;
  if (names.templates) templatesDbName = names.templates;
  if (names.meta) metaDbName = names.meta;
}

// New: allow setting Couch credentials at runtime (useful for debugging / REPL)
// export function configureCouchCredentials(opts: { url?: string; user?: string; pass?: string; host?: string }): void {
//   // set explicit couchUrl if provided
//   if (opts.url) {
//     couchUrl = opts.url;
//   }
//   // if user/pass/host provided, build a basic URL for local testing
//   if ((opts.user && opts.pass) || opts.host) {
//     const hostPart = opts.host ?? '127.0.0.1:5984';
//     const user = opts.user ?? '';
//     const pass = opts.pass ?? '';
//     if (user && pass) {
//       couchUrl = `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostPart}`;
//     } else if (opts.url) {
//       // noop, already set
//     }
//   }
//   // force a re-init on next call
//   useCouch = false;
//   nanoClient = null;
//   tasksDb = null;
//   templatesDb = null;
//   metaDb = null;
//   dbLog('info', 'configureCouchCredentials: configured couchUrl (redacted)', { hasUrl: !!couchUrl });
//   console.info('[data] configureCouchCredentials: call initCouchIfConfigured() now (server-side) to connect');
// }

// NEW: convenience helper to attempt an immediate init and return the tasks DB handle (or null)
// Call from server REPL: await ensureCouchConnected()
export async function ensureCouchConnected(): Promise<any | null> {
  dbLog('debug', 'ensureCouchConnected: ENTRY');
  const db = await initCouchIfConfigured();
  if (!db) {
    dbLog('warn', 'ensureCouchConnected: init returned null (CouchDB not available)');
    return null;
  }
  dbLog('info', 'ensureCouchConnected: tasks DB ready', { dbName: tasksDbName });
  return db;
}

function couchToTask(doc: any): Task {
  const { _id, _rev, ...rest } = doc;
  return { id: _id, ...rest } as Task;
}

function taskToCouchDoc(task: Task) {
  const { id, ...rest } = task;
  return { _id: id, ...rest };
}

// NEW: simple DB logging helper
function dbLog(level: 'debug' | 'info' | 'warn', msg: string, meta?: any): void {
  // keep logs short but timestamped
  const prefix = `[data][db] ${new Date().toISOString()}`;
  if (level === 'debug') {
    console.debug(prefix, msg, meta ?? '');
    // mirror for environments that don't show debug by default
    console.log(prefix, msg, meta ?? '');
  } else if (level === 'warn') {
    console.warn(prefix, msg, meta ?? '');
    // also output as info for higher visibility
    console.trace(prefix, msg, meta ?? '');
    console.log(prefix, 'WARN:', msg, meta ?? '');
  } else {
    console.info(prefix, msg, meta ?? '');
    // mirror to plain log as well
    console.log(prefix, msg, meta ?? '');
  }
}

// Refresh in-memory cache from Couch (called after init)
async function refreshCacheFromCouch(): Promise<void> {
  if (!useCouch) return;
  try {
    dbLog('debug', `refreshCacheFromCouch: requesting all docs from '${tasksDbName ?? 'tasks'}'`);
    console.debug('[data][db]', 'refreshCacheFromCouch: requesting all docs from', tasksDbName ?? 'tasks');
    const tasksResp = await tasksDb.list({ include_docs: true });
    dbLog('info', `refreshCacheFromCouch: received ${tasksResp?.rows?.length ?? 0} rows from tasks`);
    console.info('[data][db]', 'refreshCacheFromCouch: received rows from tasks:', tasksResp?.rows?.length ?? 0);
    const tasks = tasksResp.rows.filter((r: any) => r.doc).map((r: any) => couchToTask(r.doc));
    allTasks = tasks;

    dbLog('debug', `refreshCacheFromCouch: requesting all docs from '${templatesDbName ?? 'templates'}'`);
    console.debug('[data][db]', 'refreshCacheFromCouch: requesting all docs from', templatesDbName ?? 'templates');
    const templatesResp = await templatesDb.list({ include_docs: true });
    dbLog('info', `refreshCacheFromCouch: received ${templatesResp?.rows?.length ?? 0} rows from templates`);
    console.info('[data][db]', 'refreshCacheFromCouch: received rows from templates:', templatesResp?.rows?.length ?? 0);
    allTemplates = templatesResp.rows
      .filter((r: any) => r.doc)
      .map((r: any) => {
        const { _id, _rev, ...rest } = r.doc;
        return { id: _id, ...rest } as TaskTemplate;
      });

    // if templates empty, suggest creating sample docs
    if ((templatesResp?.rows?.length ?? 0) === 0) {
      // dbLog('info', `refreshCacheFromCouch: templates DB appears empty. To populate sample docs call createSampleDocs() or create templates in Fauxton.`);
      // console.info('[data][db]', 'refreshCacheFromCouch: templates DB appears empty. Call createSampleDocs() or create in Fauxton.');
    }

    dbLog('debug', `refreshCacheFromCouch: requesting meta 'dailyPlan'`);
    console.debug('[data][db]', "refreshCacheFromCouch: requesting meta 'dailyPlan'");
    const metaDoc = await metaDb.get('dailyPlan').catch((e: any) => {
      dbLog('warn', 'refreshCacheFromCouch: meta.get failed', e?.message ?? e);
      console.warn('[data][db]', 'refreshCacheFromCouch: meta.get failed', e?.message ?? e);
      return null;
    });
    if (metaDoc?.taskIds) {
      dbLog('info', `refreshCacheFromCouch: meta.dailyPlan contains ${metaDoc.taskIds.length} taskIds`);
      console.info('[data][db]', `refreshCacheFromCouch: meta.dailyPlan contains ${metaDoc.taskIds.length} taskIds`);
      dailyPlan = metaDoc.taskIds;
    } else {
      dbLog('info', 'refreshCacheFromCouch: no dailyPlan doc found, keeping in-memory default');
      console.info('[data][db]', 'refreshCacheFromCouch: no dailyPlan doc found, keeping in-memory default');
      // dbLog('info', 'refreshCacheFromCouch: to create a dailyPlan and sample docs call createSampleDocs() from server startup or a one-off script.');
      // console.info('[data][db]', 'refreshCacheFromCouch: to create a dailyPlan and sample docs call createSampleDocs() from server startup or a one-off script.');
    }
  } catch (err) {
    dbLog('warn', 'refreshCacheFromCouch: unexpected error', err?.message ?? err);
    console.warn('[data][db]', 'refreshCacheFromCouch: unexpected error', err?.message ?? err);
    // keep in-memory cache if any error occurs
  }
}

// --- Async DB-backed implementations (used internally and for callers that await) ---
export async function getAllTasksAsync(): Promise<Task[]> {
  // If running in the browser, don't attempt to init the server-side nano client.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/dev/list-tasks', {
        method: 'GET',
      });
      if (res.ok) {
        const created = await res.json();
        allTasks.push(created); // Reflect in-memory for UI
        return created;
      } else {
        const text = await res.text();
      }
    } catch (e) {
    }

    return
  }

  // ask init for a usable DB handle (server only). init returns the tasksDb or null.
  const db = await initCouchIfConfigured();
  if (!db) {
    // no DB available (init failed) -> return in-memory
    return JSON.parse(JSON.stringify(allTasks));
  }

  try {
    const resp = await db.list({ include_docs: true });
    console.log("*************************************", resp)
    return resp.rows.filter((r: any) => r.doc).map((r: any) => couchToTask(r.doc));
  } catch (err) {
    return JSON.parse(JSON.stringify(allTasks));
  }
}

export async function updateTaskAsync(updatedTask: Task): Promise<void> {
  // If running in the browser, use the server API to persist the task.
  if (typeof window !== 'undefined') {
    dbLog('debug', 'addTaskAsync: running in browser, using server API');
    try {
      console.log("Entered the try catch in add task async");
      const res = await fetch('/api/dev/update-task', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      console.log("Finished the fetch catch in add task async");
      if (res.ok) {
        console.log("Entered the Ok catch in add task async");
        const created = await res.json();
        dbLog('info', 'addTaskAsync: server API created task', created?.id ?? '(unknown)');
        allTasks.push(created); // Reflect in-memory for UI
        return created;
      } else {
        const text = await res.text();
        dbLog('warn', 'addTaskAsync: server API responded non-ok, falling back to in-memory', { status: res.status, text });
      }
    } catch (e) {
      dbLog('warn', 'addTaskAsync: server API call failed, falling back to in-memory', e?.message ?? e);
    }

    // Fallback to in-memory
    // allTasks.push(taskWithId);
    return JSON.parse(JSON.stringify(updatedTask));
  }

  try {
    dbLog('debug', `updateTaskAsync: getting doc ${updatedTask.id} from '${tasksDbName ?? 'tasks'}'`);
    const existing = await tasksDb.get(updatedTask.id).catch(() => null);
    const doc = taskToCouchDoc(updatedTask);
    if (existing && existing._rev) doc._rev = existing._rev;

    dbLog('debug', `updateTaskAsync: inserting/updating doc ${doc._id}`);
    const res = await tasksDb.insert(doc);
    dbLog('info', 'updateTaskAsync: insert result', res);

    const idx = allTasks.findIndex((t) => t.id === updatedTask.id);
    if (idx !== -1) allTasks[idx] = updatedTask;
  } catch (err) {
    dbLog('warn', `updateTaskAsync: failed to update ${updatedTask.id}`, {
      error: err?.message ?? err,
      doc: taskToCouchDoc(updatedTask)
    });

    const index = allTasks.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) allTasks[index] = updatedTask;
  }
}

export async function addTaskAsync(newTask: Omit<Task, 'id'>): Promise<Task> {
  const taskWithId: Task = { ...newTask, id: `task-${Date.now()}` };

  // If running in the browser, use the server API to persist the task.
  if (typeof window !== 'undefined') {
    dbLog('debug', 'addTaskAsync: running in browser, using server API');
    try {
      console.log("Entered the try catch in add task async");
      const res = await fetch('/api/dev/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      console.log("Finished the fetch catch in add task async");
      if (res.ok) {
        console.log("Entered the Ok catch in add task async");
        const created = await res.json();
        dbLog('info', 'addTaskAsync: server API created task', created?.id ?? '(unknown)');
        allTasks.push(created); // Reflect in-memory for UI
        return created;
      } else {
        const text = await res.text();
        dbLog('warn', 'addTaskAsync: server API responded non-ok, falling back to in-memory', { status: res.status, text });
      }
    } catch (e) {
      dbLog('warn', 'addTaskAsync: server API call failed, falling back to in-memory', e?.message ?? e);
    }

    // Fallback to in-memory
    // allTasks.push(taskWithId);
    return JSON.parse(JSON.stringify(taskWithId));
  }

  // Server-side: Ensure CouchDB is initialized and write to the database.
  const db = await initCouchIfConfigured();
  if (!db) {
    dbLog('warn', 'addTaskAsync: CouchDB not available (server), adding to in-memory only', taskWithId);
    // allTasks.push(taskWithId);
    return JSON.parse(JSON.stringify(taskWithId));
  }

  // Please be careful you might need this
  try {
    console.log("I entered the try catch")
    // console.log('debug', `addTaskAsync: inserting doc ${taskWithId.id} into '${tasksDbName ?? 'tasks'}'`, taskWithId);
    const res = await db.insert(taskToCouchDoc(taskWithId));
    // console.log('info', 'addTaskAsync: insert result', res);
    // allTasks.push(taskWithId);

    // Refresh cache (best effort)
    try {
      await refreshCacheFromCouch();
    } catch (e) {
      console.log('warn', 'addTaskAsync: refreshCacheFromCouch failed', e?.message ?? e);
    }

    return taskWithId;
  } catch (err) {
    console.log('warn', `addTaskAsync: insert failed for ${taskWithId.id}`, { error: err?.message ?? err });
    // allTasks.push(taskWithId); // Fallback to in-memory
    return JSON.parse(JSON.stringify(taskWithId));
  }
}

export async function deleteTaskAsync(taskId: string): Promise<void> {
  await initCouchIfConfigured();
  // if (!useCouch) {
  //   allTasks = allTasks.filter((t) => t.id !== taskId);
  //   return;
  // }
  try {
    dbLog('debug', `deleteTaskAsync: getting doc ${taskId} for delete`);
    const doc = await tasksDb.get(taskId);
    dbLog('debug', `deleteTaskAsync: destroying ${taskId} with rev ${doc._rev}`);
    const res = await tasksDb.destroy(taskId, doc._rev);
    dbLog('info', 'deleteTaskAsync: destroy result', res);
    allTasks = allTasks.filter((t) => t.id !== taskId);
  } catch (err) {
    dbLog('warn', `deleteTaskAsync: failed to delete ${taskId}`, err?.message ?? err);
    allTasks = allTasks.filter((t) => t.id !== taskId);
  }
}

// Templates
export async function getAllTemplatesAsync(): Promise<TaskTemplate[]> {
  await initCouchIfConfigured();
  // if (!useCouch) return JSON.parse(JSON.stringify(allTemplates));
  try {
    dbLog('debug', `getAllTemplatesAsync: listing docs from '${templatesDbName ?? 'templates'}'`);
    const resp = await templatesDb.list({ include_docs: true });
    dbLog('info', `getAllTemplatesAsync: received ${resp?.rows?.length ?? 0} rows`);
    return resp.rows
      .filter((r: any) => r.doc)
      .map((r: any) => {
        const { _id, _rev, ...rest } = r.doc;
        return { id: _id, ...rest } as TaskTemplate;
      });
  } catch (err) {
    console.log('err', err);
    dbLog('warn', 'getAllTemplatesAsync: error listing templates', err?.message ?? err);
    return JSON.parse(JSON.stringify(allTemplates));
  }
}

export async function addTemplateAsync(newTemplate: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
  await initCouchIfConfigured();
  const templateWithId: TaskTemplate = { ...newTemplate, id: `template-${Date.now()}` };
  const doc = { _id: templateWithId.id, ...newTemplate };

  try {
    dbLog('debug', `addTemplateAsync: inserting ${doc._id} into '${templatesDbName ?? 'templates'}'`, doc);
    console.debug('[data][db]', `addTemplateAsync: inserting ${doc._id} into '${templatesDbName ?? 'templates'}'`, doc);

    // use Nano's insert to persist the document
    const res = await templatesDb.insert(doc);

    dbLog('info', 'addTemplateAsync: insert result', res);
    console.info('[data][db]', 'addTemplateAsync: insert result', res);

    // refresh in-memory cache so subsequent reads reflect DB state
    try {
      await refreshCacheFromCouch();
      dbLog('debug', `addTemplateAsync: refreshed cache after inserting ${doc._id}`);
      console.debug('[data][db]', `addTemplateAsync: refreshed cache after inserting ${doc._id}`);
    } catch (e) {
      dbLog('warn', 'addTemplateAsync: failed to refresh cache after insert', e?.message ?? e);
      console.warn('[data][db]', 'addTemplateAsync: failed to refresh cache after insert', e?.message ?? e);
    }

    return templateWithId;
  } catch (err: any) {
    dbLog('warn', `addTemplateAsync: insert failed for ${templateWithId.id}`, { error: err?.message ?? err, doc });
    console.warn('[data][db]', `addTemplateAsync: insert failed for ${templateWithId.id}`, { error: err?.message ?? err, doc });
    // keep UI responsive by updating memory even if DB write failed
    allTemplates.push(templateWithId);
    return JSON.parse(JSON.stringify(templateWithId));
  }
}

export async function updateTemplateAsync(updatedTemplate: TaskTemplate): Promise<void> {
  await initCouchIfConfigured();
  // if (!useCouch) {
  //   const index = allTemplates.findIndex((t) => t.id === updatedTemplate.id);
  //   if (index !== -1) allTemplates[index] = updatedTemplate;
  //   return;
  // }
  let doc: any; // moved out so catch can reference it
  try {
    dbLog('debug', `updateTemplateAsync: getting doc ${updatedTemplate.id}`);
    const existing = await templatesDb.get(updatedTemplate.id).catch(() => null);
    doc = { _id: updatedTemplate.id, ...updatedTemplate };
    if (existing && existing._rev) (doc as any)._rev = existing._rev;
    dbLog('debug', `updateTemplateAsync: inserting/updating ${doc._id}`);
    const res = await templatesDb.insert(doc);
    dbLog('info', 'updateTemplateAsync: insert result', res);
    const index = allTemplates.findIndex((t) => t.id === updatedTemplate.id);
    // if
    // dbLog('debug', `updateTemplateAsync: inserting/updating ${doc._id}`);
    // const res = await templatesDb.insert(doc);
    // dbLog('info', 'updateTemplateAsync: insert result', res);
    // const index = allTemplates.findIndex((t) => t.id === updatedTemplate.id);
    if (index !== -1) allTemplates[index] = updatedTemplate;
  } catch (err) {
    dbLog('warn', `updateTemplateAsync: failed for ${updatedTemplate.id}`, { error: err?.message ?? err, doc });
    const index = allTemplates.findIndex((t) => t.id === updatedTemplate.id);
    if (index !== -1) allTemplates[index] = updatedTemplate;
  }
}

export async function deleteTemplateAsync(templateId: string): Promise<void> {
  await initCouchIfConfigured();
  // if (!useCouch) {
  //   allTemplates = allTemplates.filter((t) => t.id !== templateId);
  //   return;
  // }
  try {
    dbLog('debug', `deleteTemplateAsync: getting doc ${templateId}`);
    const doc = await templatesDb.get(templateId);
    dbLog('debug', `deleteTemplateAsync: destroying ${templateId} rev=${doc._rev}`);
    const res = await templatesDb.destroy(templateId, doc._rev);
    dbLog('info', 'deleteTemplateAsync: destroy result', res);
    allTemplates = allTemplates.filter((t) => t.id !== templateId);
  } catch (err) {
    dbLog('warn', `deleteTemplateAsync: failed to delete ${templateId}`, err?.message ?? err);
    allTemplates = allTemplates.filter((t) => t.id !== templateId);
  }
}

// Daily plan
export async function getDailyPlanAsync(): Promise<string[]> {
  await initCouchIfConfigured();
  // if (!useCouch) return [...dailyPlan];
  try {
    dbLog('debug', `getDailyPlanAsync: fetching 'dailyPlan' from '${metaDbName ?? 'meta'}'`);
    const doc = await metaDb.get('dailyPlan').catch(() => null);
    dbLog('info', `getDailyPlanAsync: received ${doc ? 'doc' : 'no doc'}`);
    return doc?.taskIds ?? [...dailyPlan];
  } catch (err) {
    dbLog('warn', 'getDailyPlanAsync: error fetching meta', err?.message ?? err);
    return [...dailyPlan];
  }
}

export async function updateDailyPlanAsync(newTaskIds: string[]): Promise<void> {
  await initCouchIfConfigured();
  // if (!useCouch) {
  //   dailyPlan = newTaskIds;
  //   return;
  // }
  try {
    dbLog('debug', `updateDailyPlanAsync: getting 'dailyPlan' doc`);
    const existing = await metaDb.get('dailyPlan').catch(() => null);
    const doc: any = { _id: 'dailyPlan', taskIds: newTaskIds };
    if (existing && existing._rev) doc._rev = existing._rev;
    dbLog('debug', `updateDailyPlanAsync: inserting/updating 'dailyPlan'`, doc);
    const res = await metaDb.insert(doc);
    dbLog('info', 'updateDailyPlanAsync: insert result', res);
    dailyPlan = newTaskIds;
  } catch (err) {
    dbLog('warn', 'updateDailyPlanAsync: failed to update dailyPlan', err?.message ?? err);
    dailyPlan = newTaskIds;
  }
}

// initCouchIfConfigured: add logs around list/create
async function initCouchIfConfigured(): Promise<any | null> {
  // already initialized and usable?
  if (useCouch && tasksDb) {
    dbLog('debug', 'initCouchIfConfigured: already initialized, returning tasksDb');
    return tasksDb;
  }

  // do not initialize in browser
  if (typeof window !== 'undefined') {
    dbLog('debug', 'initCouchIfConfigured: running in browser, skipping nano init');
    return null;
  }

  // prefer explicit configureCouch(url) or COUCHDB_URL env var
  const envUrl =
    typeof process !== 'undefined' ? (process.env.COUCHDB_URL as string | undefined) : undefined;

  // read credentials from env (do NOT hardcode in production)
  // const envUser = typeof process !== 'undefined' ? (process.env.COUCHDB_USER as string | undefined) : undefined;
  // const envPass = typeof process !== 'undefined' ? (process.env.COUCHDB_PASS as string | undefined) : undefined;
  // const envHost = typeof process !== 'undefined' ? (process.env.COUCHDB_HOST as string | undefined) : undefined;

  const defaultLocal = 'http://127.0.0.1:5984';
  // prefer explicit couchUrl (set via configureCouchCredentials or env)
  let url = couchUrl ?? envUrl ?? defaultLocal;
  // if (!couchUrl && !envUrl && envUser && envPass) {
  //   url = `http://${encodeURIComponent(envUser)}:${encodeURIComponent(envPass)}@${envHost ?? '127.0.0.1:5984'}`;
  // }

  dbLog('info', 'initCouchIfConfigured: attempting CouchDB connection to (redacted)', { hasUrl: !!url, hostHint: url?.split('@').pop?.() ?? url });
  try {
    // lazy-require nano so bundlers don't choke on clien,t builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Nano = require('nano');
    nanoClient = Nano(url);

    // list DBs to detect names and privileges
    let dbs: string[] = [];
    try {
      dbLog('debug', 'initCouchIfConfigured: listing DBs');
      dbs = await nanoClient.db.list();
      dbLog('info', `initCouchIfConfigured: available DBs: ${Array.isArray(dbs) ? dbs.join(',') : String(dbs)}`);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      dbLog('warn', 'initCouchIfConfigured: listing DBs failed', msg);
      // proceed but we may not be able to create DBs; still try to use known names
    }

    // pick DB names (prefer configured)
    const knownTasksCandidates = [tasksDbName, 'task-flow', 'tasks'].filter(Boolean) as string[];
    const lowerDbs = (dbs || []).map((d: string) => String(d).toLowerCase());
    const pickDbName = (candidates: string[]): string => {
      for (const c of candidates) {
        const lower = String(c).toLowerCase();
        const idx = lowerDbs.indexOf(lower);
        if (idx !== -1) return dbs[idx]; // return the actual DB name from the server list (preserves original casing)
      }
      return candidates[0];
    };
    const chosenTasksDbName = pickDbName(knownTasksCandidates);

    // set DB handles
    tasksDb = nanoClient.use(chosenTasksDbName);
    tasksDbName = chosenTasksDbName;
    useCouch = true;

    dbLog('info', 'initCouchIfConfigured: CouchDB connected', { url: '(redacted)', tasks: tasksDbName });
    return tasksDb;
  } catch (err: any) {
    dbLog('warn', 'initCouchIfConfigured: connection failed', err?.message ?? err);
    console.warn('[data][db]', 'initCouchIfConfigured: connection failed', err);
    nanoClient = null;
    tasksDb = null;
    useCouch = false;
    return null;
  }
}

// // New helper: create sample docs in CouchDB (idempotent / safe)
// export async function createSampleDocs(): Promise<void> {
//   await initCouchIfConfigured();
//   // if (!useCouch) {
//   //   dbLog('warn', 'createSampleDocs: CouchDB not enabled, skipping creation');
//   //   return;
//   // }

//   // sample task (matches in-memory task-1)
//   const sampleTask = {
//     _id: 'task-1',
//     title: 'Design new homepage',
//     description: 'Create mockups and a prototype for the new homepage design.',
//     priority: 'high',
//     status: 'in-progress',
//     tags: ['design', 'website', 'ux'],
//     startDate: '2024-08-01T10:00:00.000Z'
//   };

//   // sample template
//   const sampleTemplate = {
//     _id: 'template-1',
//     title: 'New Employee Onboarding',
//     description: 'A standard checklist for onboarding a new team member.',
//     priority: 'medium',
//     tags: ['hr', 'onboarding'],
//     subtasks: [{ id: 'tsub-1-1', title: 'Set up hardware (laptop, monitor)' }]
//   };

//   // sample meta dailyPlan
//   const sampleMeta = { _id: 'dailyPlan', taskIds: ['task-1'] };

//   try {
//     // tasks
//     try {
//       const existing = await tasksDb.get(sampleTask._id).catch(() => null);
//       if (!existing) {
//         dbLog('info', `createSampleDocs: inserting sample task ${sampleTask._id}`);
//         await tasksDb.insert(sampleTask);
//       } else {
//         dbLog('debug', `createSampleDocs: sample task ${sampleTask._id} already exists, skipping`);
//       }
//     } catch (e) {
//       dbLog('warn', 'createSampleDocs: task insert failed', e?.message ?? e);
//     }

//     // templates
//     try {
//       const existingT = await templatesDb.get(sampleTemplate._id).catch(() => null);
//       if (!existingT) {
//         dbLog('info', `createSampleDocs: inserting sample template ${sampleTemplate._id}`);
//         await templatesDb.insert(sampleTemplate);
//       } else {
//         dbLog('debug', `createSampleDocs: sample template ${sampleTemplate._id} already exists, skipping`);
//       }
//     } catch (e) {
//       dbLog('warn', 'createSampleDocs: template insert failed', e?.message ?? e);
//     }

//     // // meta
//     // try {
//     //   const existingM = await metaDb.get(sampleMeta._id).catch(() => null);
//     //   if (!existingM) {
//     //     dbLog('info', `createSampleDocs: inserting sample meta ${sampleMeta._id}`);
//     //     await metaDb.insert(sampleMeta);
//     //   } else {
//     //     dbLog('debug', `createSampleDocs: sample meta ${sampleMeta._id} already exists, skipping`);
//     //   }
//     // } catch (e) {
//     //   dbLog('warn', 'createSampleDocs: meta insert failed', e?.message ?? e);
//     // }

//     // refresh local cache
//     await refreshCacheFromCouch();
//     dbLog('info', 'createSampleDocs: finished and refreshed cache');
//   } catch (err) {
//     dbLog('warn', 'createSampleDocs: unexpected failure', err?.message ?? err);
//   }
// }

// Helper to detect Couch usage
export function isCouchEnabled(): boolean {
  console.log('Couch usage:', useCouch);
  return useCouch;
}

// Auto-init on server if COUCHDB_URL is set
if (typeof window === 'undefined') {
  console.info('[data] server startup: initCouchIfConfigured scheduled');
  initCouchIfConfigured().catch((err) => {
    console.warn('[data] initCouchIfConfigured error:', err);
  });
}

// --- Synchronous wrappers (compat for callers that don't await) ---
export async function getAllTasks(): Promise<Task[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/dev/list-tasks', {
        method: 'GET',
      });
      if (res.ok) {
        const created = await res.json();
        allTasks.push(created); // Reflect in-memory for UI
        return created;
      } else {
        const text = await res.text();
      }
    } catch (e) {
    }

    return
  }
  return JSON.parse(JSON.stringify(allTasks));
}

// Replace the getAllTemplates function with an exported const to ensure the symbol is statically exported
export const getAllTemplates = (): TaskTemplate[] => {
  return JSON.parse(JSON.stringify(allTemplates));
}

export const getDailyPlan = (): string[] => {
  return [...dailyPlan];
}

// Add missing synchronous wrappers expected by the UI (they update in-memory state and persist in background)
export function addTask(newTask: Omit<Task, 'id'>): Task {
  const taskWithId: Task = { ...newTask, id: `task-${Date.now()}` };
  allTasks.push(taskWithId);
  void addTaskAsync(newTask);
  return taskWithId;
}

export function updateTask(updatedTask: Task): void {
  const index = allTasks.findIndex((t) => t.id === updatedTask.id);
  if (index !== -1) allTasks[index] = updatedTask;
  void updateTaskAsync(updatedTask);
}

export function deleteTask(taskId: string): void {
  allTasks = allTasks.filter((t) => t.id !== taskId);
  void deleteTaskAsync(taskId);
}

export function addTemplate(newTemplate: Omit<TaskTemplate, 'id'>): TaskTemplate {
  const templateWithId: TaskTemplate = { ...newTemplate, id: `template-${Date.now()}` };
  allTemplates.push(templateWithId);
  void addTemplateAsync(newTemplate);
  return templateWithId;
}

export function updateTemplate(updatedTemplate: TaskTemplate): void {
  const index = allTemplates.findIndex((t) => t.id === updatedTemplate.id);
  if (index !== -1) allTemplates[index] = updatedTemplate;
  void updateTemplateAsync(updatedTemplate);
}

export function deleteTemplate(templateId: string): void {
  // remove from in-memory cache immediately so UI updates
  allTemplates = allTemplates.filter((t) => t.id !== templateId);
  // attempt to persist deletion asynchronously
  void deleteTemplateAsync(templateId);
}

// NEW: server API endpoint used by browser to persist tasks (avoids direct client-to-Couch CORS)
let serverApiUrl = '/api/dev/add-task';
export function configureServerApiUrl(url: string): void {
  // simple override for local development
  serverApiUrl = url;
  dbLog('info', 'configureServerApiUrl: set', { serverApiUrl });
}
// // NEW: server API endpoint used by browser to persist tasks (avoids direct client-to-Couch CORS)
// let serverApiUrl = '/api/dev/add-task';
// export function configureServerApiUrl(url: string): void {
// 	// simple override for local development
// 	serverApiUrl = url;
// 	dbLog('info', 'configureServerApiUrl: set', { serverApiUrl });
// }
// 	dbLog('info', 'configureServerApiUrl: set', { serverApiUrl });
// }
