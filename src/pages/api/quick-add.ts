import type { NextApiRequest, NextApiResponse } from 'next';
import { addTaskAsync } from '../../lib/data-service';
import { getUserIdFromRequest } from '../../lib/api-auth';
import { parseReminder } from '../../lib/reminder-parser';
import type { Task } from '../../lib/types';

/**
 * Quick-add a reminder from natural-language text.
 *
 * This is the shared entry point for voice / assistant integrations: a Google
 * App Action (or any automation) deep-links into the app, which POSTs the
 * spoken text here. The text is parsed into a reminder task and saved for the
 * authenticated user.
 *
 * Body: { text: string, now?: number (epoch ms), tzOffsetMinutes?: number }
 *   now / tzOffsetMinutes let the caller parse dates in the device's local
 *   frame; they default to the server clock (UTC) when omitted.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { text, now, tzOffsetMinutes } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'A non-empty "text" string is required' });
    }

    const nowMs = typeof now === 'number' && Number.isFinite(now) ? now : Date.now();
    const tz = typeof tzOffsetMinutes === 'number' && Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;

    const parsed = parseReminder(text, nowMs, tz);

    const newTask: Omit<Task, 'id'> = {
      title: parsed.title,
      description: '',
      priority: parsed.priority,
      status: 'todo',
      subtasks: [],
      notes: [],
      tags: ['reminder'],
      ...(parsed.dueIso ? { doDate: parsed.dueIso, endDate: parsed.dueIso } : {}),
    };

    const created = await addTaskAsync(newTask, userId);
    return res.status(201).json({ task: created, parsed });
  } catch (error: any) {
    console.error('[API] quick-add error:', error?.message ?? error);
    return res.status(500).json({ error: 'Failed to add reminder' });
  }
}
