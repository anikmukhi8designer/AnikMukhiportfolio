
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { verifyPassword, generateSessionToken, serializeCookie } from '../../lib/auth-utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await generateSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_temp_password: user.is_temp_password
    });

    const cookie = serializeCookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ 
      success: true, 
      redirect: user.is_temp_password ? '/#admin/change-password' : '/#admin' 
    });

  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
