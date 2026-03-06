import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllTasksAsync, addTaskAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = await verifyToken(token);
    let userId = decoded?.userId;

    // Self-healing fallback if token was generated prior to the bugfix
    if (decoded && !userId && decoded.email) {
      const { getUserByEmailAsync } = await import('../../../lib/data-service');
      const user = await getUserByEmailAsync(decoded.email);
      if (user && user.id && user.id !== '') {
        userId = user.id;
      }
    }

    if (!decoded || !userId) {
      return res.status(401).json({
        error: 'Invalid token',
        debug: { decodedPayload: decoded, finalUserId: userId || "empty" }
      });
    }

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
