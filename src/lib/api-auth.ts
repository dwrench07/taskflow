import type { NextApiRequest } from 'next';
import { verifyToken } from './auth';
import { getUserByEmailAsync } from './data-service';

/**
 * Resolves the authenticated user's id from the request's session cookie.
 *
 * Returns the userId string, or null when there is no valid session. Routes
 * should treat null as a 401 and must NOT fall back to a client-supplied
 * userId (query/body), which would allow cross-user access (IDOR).
 */
export async function getUserIdFromRequest(req: NextApiRequest): Promise<string | null> {
    const token = req.cookies.token;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    let userId = decoded.userId;

    // Fallback for older tokens that only carried an email.
    if (!userId && decoded.email) {
        const user = await getUserByEmailAsync(decoded.email);
        if (user && user.id && user.id !== '') {
            userId = user.id;
        }
    }

    return userId || null;
}
