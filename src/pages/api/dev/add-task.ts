import type { NextApiRequest, NextApiResponse } from 'next';
import { addTaskAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Dev-only helper. Never expose task mutation without auth in production.
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newTask = req.body;
    if (!newTask || typeof newTask !== 'object') {
      return res.status(400).json({ error: 'Invalid task data' });
    }

    const createdTask = await addTaskAsync(newTask);
    return res.status(201).json(createdTask);
  } catch (error: any) {
    console.error('[API] add-task error:', error.message ?? error);
    return res.status(500).json({ error: 'Failed to add task' });
  }
}
