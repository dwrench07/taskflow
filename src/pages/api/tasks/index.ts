import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCouchConnected } from '../../../lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureCouchConnected();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const tasks = await db.list({ include_docs: true });
    const allTasks = tasks.rows.map((row: any) => row.doc);

    return res.status(200).json(allTasks);
  } catch (error: any) {
    console.error('[API] Error fetching tasks:', error.message ?? error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}
