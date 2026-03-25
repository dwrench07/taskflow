import type { NextApiRequest, NextApiResponse } from 'next';
import { updateMistakeLogEntryAsync, deleteMistakeLogEntryAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, userId } = req.query as { id: string; userId?: string };

  try {
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
