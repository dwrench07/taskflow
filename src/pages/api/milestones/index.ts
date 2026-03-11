import type { NextApiRequest, NextApiResponse } from 'next';
import { getMilestonesAsync, addMilestoneAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const milestones = await getMilestonesAsync(userId);
      return res.status(200).json(milestones);
    } 
    
    if (req.method === 'POST') {
      const milestone = await addMilestoneAsync(req.body, userId);
      return res.status(201).json(milestone);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/milestones:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
