import type { NextApiRequest, NextApiResponse } from 'next';
import { addTaskAsync } from '../../../lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
