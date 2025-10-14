import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllTasksAsync } from '../../../lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("********** In list-tasks.ts **********");
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const listTasks = await getAllTasksAsync();
    return res.status(201).json(listTasks);
  } catch (error: any) {
    console.error('[API] add-task error:', error.message ?? error);
    return res.status(500).json({ error: 'Failed to add task' });
  }
}
