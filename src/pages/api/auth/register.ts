import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmailAsync, createUserAsync } from '../../../lib/data-service';
import { hashPassword, signToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await getUserByEmailAsync(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await createUserAsync({
            id: '', // Will be generated
            email,
            password: hashedPassword,
            name,
            roles: ['user']
        });

        if (!newUser) {
            throw new Error('Failed to create user');
        }

        // Generate JWT token
        const token = await signToken({
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

        // Set HttpOnly cookie
        res.setHeader('Set-Cookie', serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        }));

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
        console.error('[API] Register error:', error);
        return res.status(500).json({ error: 'Failed to register user' });
    }
}
