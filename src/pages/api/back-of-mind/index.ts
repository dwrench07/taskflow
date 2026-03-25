import type { NextApiRequest, NextApiResponse } from 'next';
import { getBackOfMindItemsAsync, addBackOfMindItemAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const items = await getBackOfMindItemsAsync(userId);
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const item = await addBackOfMindItemAsync(req.body, userId);
      return res.status(201).json(item);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/back-of-mind:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
