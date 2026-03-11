import type { NextApiRequest, NextApiResponse } from 'next';
import { getFocusSessionsAsync, updateFocusSessionAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';
import type { FocusSession } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

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
            if (user && user.id) {
                userId = user.id;
            }
        }

        if (!decoded || !userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        switch (req.method) {
            case 'PUT':
                const sessions = await getFocusSessionsAsync(userId);
                const session = sessions.find((s: FocusSession) => s.id === id);

                if (!session) {
                    return res.status(404).json({ error: 'Focus session not found' });
                }

                // Update allowed fields
                const { distractions, productivityScore, energyLevel } = req.body;
                
                if (distractions !== undefined) session.distractions = distractions;
                if (productivityScore !== undefined) session.productivityScore = productivityScore;
                if (energyLevel !== undefined) session.energyLevel = energyLevel;

                await updateFocusSessionAsync(session, userId);
                return res.status(200).json(session);

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error(`[API] Error handling focus-session ${id}:`, error.message ?? error);
        return res.status(500).json({ error: `Failed to update focus session` });
    }
}
