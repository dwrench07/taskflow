// import type { NextApiRequest, NextApiResponse } from 'next';
// import { ensureCouchConnected } from '../../../lib/data';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { id } = req.query;

//   if (!id || typeof id !== 'string') {
//     return res.status(400).json({ error: 'Invalid or missing task ID' });
//   }

//   try {
//     const db = await ensureCouchConnected();
//     if (!db) {
//       return res.status(500).json({ error: 'Database connection failed' });
//     }

//     const task = await db.get(id).catch(() => null);
//     console.log("|||||----|||||", task)
//     if (!task) {
//       return res.status(404).json({ error: 'Task not found' });
//     }
//     console.log('Fetched task:', task);
//     return res.status(200).json(task);
//   } catch (error: any) {
//     console.error('[API] Error fetching task:', error.message ?? error);
//     return res.status(500).json({ error: 'Failed to fetch task' });
//   }
// }
