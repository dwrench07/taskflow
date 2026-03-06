import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllTasksAsync, addTaskAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.headers['x-user-id'] as string || null;

    switch (req.method) {
      case 'GET':
        const tasks = await getAllTasksAsync(userId);
        return res.status(200).json(tasks);

      case 'POST':
        const newTask = req.body;
        if (!newTask || typeof newTask !== 'object') {
          return res.status(400).json({ error: 'Invalid task data' });
        }

        const createdTask = await addTaskAsync(newTask, userId);
        return res.status(201).json(createdTask);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`[API] Error handling tasks:`, error.message ?? error);
    return res.status(500).json({ error: `Failed to ${req.method?.toLowerCase()} tasks` });
  }
}
