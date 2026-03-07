import type { NextApiRequest, NextApiResponse } from 'next';
import { getGoalAsync, updateGoalAsync, deleteGoalAsync } from '../../../lib/data-service';
import type { Goal } from '../../../lib/types';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing goal ID' });
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
            const goal = await getGoalAsync(id, userId);

            if (!goal) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            return res.status(200).json(goal);
        }
        else if (req.method === 'PUT') {
            const goalData = req.body as Goal;

            if (!goalData.title || !goalData.status) {
                return res.status(400).json({
                    error: 'Missing required fields: title and status are required'
                });
            }

            if (goalData.id !== id) {
                return res.status(400).json({
                    error: 'Goal ID in body does not match URL parameter'
                });
            }

            const existingGoal = await getGoalAsync(id, userId);
            if (!existingGoal) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            const safelyMergedGoal: Goal = {
                ...existingGoal,
                ...goalData,
                id
            };

            await updateGoalAsync(safelyMergedGoal, userId);
            return res.status(200).json({ message: 'Goal updated successfully' });
        }
        else if (req.method === 'DELETE') {
            const success = await deleteGoalAsync(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Goal not found or you do not have permission to delete it' });
            }

            return res.status(200).json({ message: 'Goal deleted successfully' });
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('[API] Error in /api/goals/[id]:', error.message ?? error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
