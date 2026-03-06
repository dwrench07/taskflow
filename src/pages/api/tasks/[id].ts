import type { NextApiRequest, NextApiResponse } from 'next';
import { getTaskAsync, updateTaskAsync } from '../../../lib/data-service';
import type { Task } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing task ID' });
    }

    try {
        if (req.method === 'GET') {
            // Get task by ID
            const task = await getTaskAsync(id);

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            return res.status(200).json(task);
        }
        else if (req.method === 'PUT') {
            // Update task
            const taskData = req.body as Task;

            // Extract the simple user authentication simulation
            const userId = req.headers['x-user-id'] as string || null;

            // Validate required fields
            if (!taskData.title || !taskData.priority || !taskData.status) {
                return res.status(400).json({
                    error: 'Missing required fields: title, priority, and status are required'
                });
            }

            // Ensure the ID matches
            if (taskData.id !== id) {
                return res.status(400).json({
                    error: 'Task ID in body does not match URL parameter'
                });
            }

            // Check if task exists before updating
            const existingTask = await getTaskAsync(id);
            if (!existingTask) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Safe Merge: Protect against stale clients wiping out fields
            const safelyMergedTask: Task = {
                ...existingTask,
                ...taskData,
                id // Explicitly preserve the ID
            };

            await updateTaskAsync(safelyMergedTask, userId);
            return res.status(200).json({ message: 'Task updated successfully' });
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('[API] Error in /api/tasks/[id]:', error.message ?? error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
