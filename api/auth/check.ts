
import { verifySessionToken } from '../../lib/auth-utils';

export default async function handler(req: any, res: any) {
  // Parse cookies from header
  const cookieHeader = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach((cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = decodeURIComponent(value);
  });

  const token = cookies['admin_session'];

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const payload = await verifySessionToken(token);
  
  if (!payload) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ 
    authenticated: true, 
    user: payload 
  });
}
