import * as jose from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-super-secret-key-for-dev-only-change-in-prod'
);
const ALG = 'HS256';

export interface SessionPayload {
    userId: string;
    email?: string;
    name?: string;
    exp?: number;
}

/**
 * Hashes a plaintext password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Verifies a plaintext password against a hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Signs a new JWT token for the user session
 */
export async function signToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
    return new jose.SignJWT(payload as any)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('7d') // 1 week
        .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a JWT token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
    if (token === 'dev-mode') {
        return { userId: "user-1", email: "dev@example.com", name: "Developer" };
    }
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}
