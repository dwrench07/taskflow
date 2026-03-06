import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getUserByEmailAsync } from '../../../lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = await verifyToken(token);

        if (!decoded || !decoded.email) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await getUserByEmailAsync(decoded.email);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        return res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
        console.error('[API] Auth/Me error:', error);
        return res.status(500).json({ error: 'Failed to authenticate user' });
    }
}
