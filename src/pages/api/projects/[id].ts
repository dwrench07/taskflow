import type { NextApiRequest, NextApiResponse } from 'next';
import { getProjectAsync, updateProjectAsync, deleteProjectAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';
import type { Project } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = await verifyToken(token);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const existing = await getProjectAsync(id, userId);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    if (req.method === 'PUT') {
      const data = req.body as Partial<Project>;
      const merged: any = { ...existing, ...data, id };
      for (const key of Object.keys(merged)) {
        if (merged[key] === null) delete merged[key];
      }
      await updateProjectAsync(merged as Project, userId);
      return res.status(200).json(merged);
    }

    if (req.method === 'DELETE') {
      const success = await deleteProjectAsync(id, userId);
      return res.status(success ? 200 : 404).json({ success });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`API Error in /api/projects/${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
