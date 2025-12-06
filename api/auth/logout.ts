
import { serializeCookie } from '../../lib/auth-utils';

export default async function handler(_req: any, res: any) {
  const cookie = serializeCookie('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Expire immediately
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
