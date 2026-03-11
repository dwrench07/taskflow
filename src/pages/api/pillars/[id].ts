import type { NextApiRequest, NextApiResponse } from 'next';
import { deletePillarAsync, getPillarByIdAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const pillar = await getPillarByIdAsync(id, userId);
      if (!pillar) return res.status(404).json({ error: 'Pillar not found' });
      return res.status(200).json(pillar);
    }
    
    if (req.method === 'DELETE') {
      const success = await deletePillarAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/pillars/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
