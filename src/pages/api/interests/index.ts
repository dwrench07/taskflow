import type { NextApiRequest, NextApiResponse } from 'next';
import { getInterestsAsync, addInterestAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
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
