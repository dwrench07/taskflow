import type { NextApiRequest, NextApiResponse } from 'next';
import { updateMistakeLogEntryAsync, deleteMistakeLogEntryAsync } from '../../../lib/data-service';
import { getUserIdFromRequest } from '../../../lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'PUT') {
      await updateMistakeLogEntryAsync({ ...req.body, id }, userId);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const success = await deleteMistakeLogEntryAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/mistake-log/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
