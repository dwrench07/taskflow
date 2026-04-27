import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllProjectsAsync, addProjectAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = await verifyToken(token);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      const projects = await getAllProjectsAsync(userId);
      return res.status(200).json(projects);
    }

    if (req.method === 'POST') {
      const project = await addProjectAsync(req.body, userId);
      return res.status(201).json(project);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('API Error in /api/projects:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
