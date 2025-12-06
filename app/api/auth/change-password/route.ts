
import { NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';
import { getSession, hashPassword, verifyPassword, createSession } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password too short' }, { status: 400 });
    }

    // 1. Get current user data to verify old password again (security)
    const { data: user } = await supabase.from('auth_users').select('*').eq('id', session.id).single();
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });

    // 2. Hash new password
    const newHash = await hashPassword(newPassword);

    // 3. Update DB
    const { error } = await supabase
        .from('auth_users')
        .update({ 
            password_hash: newHash, 
            is_temp_password: false,
            updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

    if (error) throw error;

    // 4. Refresh Session (remove temp flag)
    await createSession({
      ...session,
      is_temp_password: false
    });

    return NextResponse.json({ success: true });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
