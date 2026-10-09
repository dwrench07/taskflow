import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllTasksAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Dev-only helper. Never expose unscoped task reads in production.
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const listTasks = await getAllTasksAsync();
    return res.status(200).json(listTasks);
  } catch (error: any) {
    console.error('[API] list-tasks error:', error.message ?? error);
    return res.status(500).json({ error: 'Failed to list tasks' });
  }
}
