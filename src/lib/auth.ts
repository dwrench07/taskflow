import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALG = 'HS256';
const DEV_FALLBACK_SECRET = 'fallback-super-secret-key-for-dev-only-change-in-prod';

// Cache the resolved secret for the process lifetime so every call signs/verifies
// with the same key (and we don't re-read the file or re-warn on every request).
let cachedSecret: Uint8Array | null = null;

/**
 * Resolves the JWT signing secret.
 *
 * Preference order:
 *  1. `JWT_SECRET` env var — always use it when set (required for stable,
 *     multi-instance deployments; set this in production).
 *  2. Development — a known dev-only fallback.
 *  3. Production with no `JWT_SECRET` — rather than hard-failing every login
 *     with a 500, generate a strong random secret and persist it to
 *     `.jwt-secret` so sessions survive restarts on a single host. We warn
 *     loudly: a generated secret is NOT shared across instances, so set
 *     `JWT_SECRET` for anything beyond a single-process deployment.
 *
 * Resolved lazily (not at import) so a prod build without the env var set does
 * not crash at build time.
 */
function getJwtSecret(): Uint8Array {
    if (cachedSecret) return cachedSecret;

    const envSecret = process.env.JWT_SECRET;
    if (envSecret) {
        cachedSecret = new TextEncoder().encode(envSecret);
        return cachedSecret;
    }

    if (process.env.NODE_ENV !== 'production') {
        cachedSecret = new TextEncoder().encode(DEV_FALLBACK_SECRET);
        return cachedSecret;
    }

    // Production, no JWT_SECRET: self-heal with a persisted random secret.
    const secretFile = path.join(process.cwd(), '.jwt-secret');
    let secret: string | null = null;
    try {
        if (fs.existsSync(secretFile)) {
            secret = fs.readFileSync(secretFile, 'utf8').trim() || null;
        }
    } catch {
        /* unreadable — fall through to generating one */
    }
    if (!secret) {
        secret = crypto.randomBytes(48).toString('hex');
        try {
            fs.writeFileSync(secretFile, secret, { mode: 0o600 });
        } catch {
            /* read-only FS (e.g. serverless): keep the secret in memory for this process only */
        }
    }
    console.warn(
        '[auth] JWT_SECRET is not set; using a generated secret. ' +
        'Set the JWT_SECRET environment variable for stable sessions across restarts and multiple instances.'
    );
    cachedSecret = new TextEncoder().encode(secret);
    return cachedSecret;
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
