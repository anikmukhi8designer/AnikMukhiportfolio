
import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-dev-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
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

export async function createSession(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);

  cookies().set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const session = cookies().get('admin_session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  cookies().delete('admin_session');
}
