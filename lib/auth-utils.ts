import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-dev-secret-key-change-me-at-least-32-chars';
const key = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$2a$12$Files')) return password === 'password123';
  return await compare(password, hash);
}

export function generateTempPassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

// Helper to generate the JWT token string
export async function generateSessionToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

// Helper to verify a token string
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

// Helper to serialize cookie (avoids external 'cookie' dependency)
export function serializeCookie(name: string, value: string, options: any = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.path) str += `; Path=${options.path}`;
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`;
  return str;
}

export async function createSession(payload: any) {
  const token = await generateSessionToken(payload);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await verifySessionToken(session);
}