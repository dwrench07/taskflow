import type { NextApiRequest, NextApiResponse } from 'next';
import { getFocusRemindersAsync, upsertFocusRemindersAsync } from '../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const reminders = await getFocusRemindersAsync(userId);
      return res.status(200).json(reminders);
    }

    if (req.method === 'PUT') {
      const reminders = await upsertFocusRemindersAsync(req.body, userId);
      return res.status(200).json(reminders);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/focus-reminders:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
