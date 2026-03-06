import type { NextApiRequest, NextApiResponse } from 'next';
import { getTaskAsync, updateTaskAsync, deleteTaskAsync } from '../../../lib/data-service';
import type { Task } from '../../../lib/types';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing task ID' });
    }

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = await verifyToken(token);
        let userId = decoded?.userId;

        if (decoded && !userId && decoded.email) {
            const { getUserByEmailAsync } = await import('../../../lib/data-service');
            const user = await getUserByEmailAsync(decoded.email);
            if (user && user.id && user.id !== '') {
                userId = user.id;
            }
        }

        if (!decoded || !userId) {
            return res.status(401).json({
                error: 'Invalid token',
                debug: { decodedPayload: decoded, finalUserId: userId || "empty" }
            });
        }

        if (req.method === 'GET') {
            // Get task by ID using userId scope
            const task = await getTaskAsync(id, userId);

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            return res.status(200).json(task);
        }
        else if (req.method === 'PUT') {
            // Update task
            const taskData = req.body as Task;

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

            // Check if task exists before updating and that the user owns it
            const existingTask = await getTaskAsync(id, userId);
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
        else if (req.method === 'DELETE') {
            // Delete task
            const success = await deleteTaskAsync(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Task not found or you do not have permission to delete it' });
            }

            return res.status(200).json({ message: 'Task deleted successfully' });
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('[API] Error in /api/tasks/[id]:', error.message ?? error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
