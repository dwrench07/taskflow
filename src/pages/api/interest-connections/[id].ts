import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteInterestConnectionAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, userId } = req.query as { id: string; userId?: string };

  try {
    if (req.method === 'DELETE') {
      const success = await deleteInterestConnectionAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/interest-connections/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
