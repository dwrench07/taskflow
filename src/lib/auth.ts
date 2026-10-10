import * as jose from 'jose';
import bcrypt from 'bcryptjs';

const ALG = 'HS256';

/**
 * Resolves the signing secret. In production a real JWT_SECRET is mandatory —
 * the dev fallback would let anyone forge tokens — so we fail fast instead of
 * silently using it. Resolved lazily (not at import) so a prod build without
 * the env var set doesn't crash at build time.
 */
function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET environment variable is required in production');
        }
        return new TextEncoder().encode('fallback-super-secret-key-for-dev-only-change-in-prod');
    }
    return new TextEncoder().encode(secret);
}

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
        .sign(getJwtSecret());
}

/**
 * Verifies and decodes a JWT token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, getJwtSecret());
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}
