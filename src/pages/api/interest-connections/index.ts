import type { NextApiRequest, NextApiResponse } from 'next';
import { getInterestConnectionsAsync, addInterestConnectionAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query as { userId?: string };

  try {
    if (req.method === 'GET') {
      const connections = await getInterestConnectionsAsync(userId);
      return res.status(200).json(connections);
    }

    if (req.method === 'POST') {
      const connection = await addInterestConnectionAsync(req.body, userId);
      return res.status(201).json(connection);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/interest-connections:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
