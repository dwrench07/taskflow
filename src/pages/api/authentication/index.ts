import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        switch (req.method) {
            case 'GET':
                const { userId } = req.query;

                if (!userId || typeof userId !== 'string') {
                    // If no userId is provided, we might want to return 401 or just null.
                    // Based on the client usage in data.ts, it expects a user object or null.
                    // However, data.ts calls /api/auth (which we are replacing/mimicking here).
                    // If this is a general "get current user" endpoint, it usually relies on a cookie/token.
                    // But our plan was to use userId query param for now as per the login flow.
                    return res.status(400).json({ error: 'User ID is required' });
                }

                const user = await getUserAsync(userId);
                console.log('Fetched user:', user);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                return res.status(200).json({ user });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error(`[API] Error handling authentication:`, error.message ?? error);
        return res.status(500).json({ error: `Failed to authenticate` });
    }
}
