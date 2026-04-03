import type { NextApiRequest, NextApiResponse } from 'next';
import { getChoreAsync, deleteChoreAsync, updateChoreAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';
import type { Chore } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = await verifyToken(token);
    const userId = decoded?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if chore exists and belongs to user
    const existingChore = await getChoreAsync(id, userId);
    if (!existingChore) {
      return res.status(404).json({ error: 'Chore not found' });
    }

    if (req.method === 'PUT') {
      const choreData = req.body as Partial<Chore>;
      
      // Safe Merge: Protect against wiping fields
      const safelyMergedChore: Chore = {
        ...existingChore,
        ...choreData,
        id // Preserve the ID
      };

      const updated = await updateChoreAsync(safelyMergedChore, userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const success = await deleteChoreAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/chores/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
