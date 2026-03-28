import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteChoreAsync, updateChoreAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'PUT') {
      const updated = await updateChoreAsync({ ...req.body, id }, userId);
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
