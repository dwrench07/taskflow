import type { NextApiRequest, NextApiResponse } from 'next';
import { getGoalsAsync, addGoalAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = await verifyToken(token);
        let userId = decoded?.userId;

        // Self-healing fallback if token was generated prior to the bugfix
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

        switch (req.method) {
            case 'GET':
                const goals = await getGoalsAsync(userId);
                return res.status(200).json(goals);

            case 'POST':
                const newGoal = req.body;
                if (!newGoal || typeof newGoal !== 'object') {
                    return res.status(400).json({ error: 'Invalid goal data' });
                }

                const createdGoal = await addGoalAsync(newGoal, userId);
                return res.status(201).json(createdGoal);

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error(`[API] Error handling goals:`, error.message ?? error);
        return res.status(500).json({ error: `Failed to ${req.method?.toLowerCase()} goals` });
    }
}
