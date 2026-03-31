import { NextApiRequest, NextApiResponse } from 'next';
import { TaskTemplate } from '@/lib/types';
import { verifyToken } from '@/lib/auth';

// Temporary dummy templates to prevent 404 errors until database support is fully implemented
const MOCK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'template-1',
    title: 'Weekly Review',
    description: 'A comprehensive review of the past week, planning for the next.',
    priority: 'medium',
    subtasks: [
      { id: 'sub-t1-1', title: 'Clear inbox to zero', priority: 'medium' },
      { id: 'sub-t1-2', title: 'Review completed tasks', priority: 'low' },
      { id: 'sub-t1-3', title: 'Plan priorities for next week', priority: 'high', energyLevel: 'high' }
    ],
    tags: ['review', 'planning']
  },
  {
    id: 'template-2',
    title: 'Deep Work Session',
    description: 'A 90-minute block dedicated to the most important task.',
    priority: 'high',
    subtasks: [
      { id: 'sub-t2-1', title: 'Close distractions & Slack', priority: 'urgent' },
      { id: 'sub-t2-2', title: 'Start timer for 90m', priority: 'high' }
    ],
    tags: ['focus', 'deep-work'],
    energyLevel: 'high'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse<TaskTemplate[] | { error: string }>) {
  try {
    const user = verifyToken(req);
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
