import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmailAsync } from '../../../lib/data-service';
import { verifyPassword, signToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await getUserByEmailAsync(email);
        if (!user || (!user.password && user.password !== '')) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await verifyPassword(password, user.password || '');
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name
        });

        // Set HttpOnly cookie
        res.setHeader('Set-Cookie', serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        }));

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        return res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
        console.error('[API] Login error:', error);
        return res.status(500).json({ error: 'Failed to login' });
    }
}
