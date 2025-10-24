import type { NextApiRequest, NextApiResponse } from 'next';
import { updateTaskAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const updatedTask = req.body;
    if (!updatedTask || typeof updatedTask !== 'object' || !updatedTask.id) {
      return res.status(400).json({ error: 'Invalid task data or missing task ID' });
    }

    await updateTaskAsync(updatedTask);
    return res.status(200).json(updatedTask);
  } catch (error: any) {
    console.error('[API] update-task error:', error.message ?? error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}
