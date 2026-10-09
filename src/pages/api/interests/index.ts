import type { NextApiRequest, NextApiResponse } from 'next';
import { getInterestsAsync, addInterestAsync } from '../../../lib/data-service';
import { getUserIdFromRequest } from '../../../lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'GET') {
      const interests = await getInterestsAsync(userId);
      return res.status(200).json(interests);
    }

    if (req.method === 'POST') {
      const interest = await addInterestAsync(req.body, userId);
      return res.status(201).json(interest);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/interests:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
