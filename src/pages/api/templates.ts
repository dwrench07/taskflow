import { NextApiRequest, NextApiResponse } from 'next';
import { TaskTemplate } from '@/lib/types';
import { verifyToken } from '@/lib/auth';

// Temporary dummy templates to prevent 404 errors until database support is fully implemented
const MOCK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-1',
    title: 'Weekly Review',
    description: 'A comprehensive review of the past week, planning for the next.',
    tags: ['review', 'planning'],
    tasks: [
      { title: 'Clear inbox to zero', priority: 'medium' },
      { title: 'Review completed tasks', priority: 'low' },
      { title: 'Plan priorities for next week', priority: 'high', energyLevel: 'high' },
    ],
    subtasks: [],
  },
  {
    id: 'template-2',
    title: 'Deep Work Session',
    description: 'A 90-minute block dedicated to the most important task.',
    tags: ['focus', 'deep-work'],
    tasks: [
      { title: 'Close distractions & Slack', priority: 'urgent' },
      { title: 'Start timer for 90m', priority: 'high' },
    ],
    subtasks: [],
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse<TaskTemplate[] | { error: string }>) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // In the future, this will connect to the DatabaseAdapter
      // const db = ...
      // const templates = await db.getTemplates(user.userId);
      return res.status(200).json(MOCK_TEMPLATES);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /templates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
