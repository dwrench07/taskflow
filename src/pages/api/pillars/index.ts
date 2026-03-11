import type { NextApiRequest, NextApiResponse } from 'next';
import { getPillarsAsync, addPillarAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const pillars = await getPillarsAsync(userId);
      return res.status(200).json(pillars);
    } 
    
    if (req.method === 'POST') {
      const pillar = await addPillarAsync(req.body, userId);
      return res.status(201).json(pillar);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/pillars:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
