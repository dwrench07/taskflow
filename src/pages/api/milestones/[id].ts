import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteMilestoneAsync, updateMilestoneAsync } from '../../../lib/data-service';
import { getUserIdFromRequest } from '../../../lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'DELETE') {
      const success = await deleteMilestoneAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updated = await updateMilestoneAsync({ ...req.body, id }, userId);
      return res.status(200).json(updated);
    }

    res.setHeader('Allow', ['DELETE', 'PATCH', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/milestones/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
