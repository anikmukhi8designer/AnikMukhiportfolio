
import { NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';
import { verifyPassword, createSession } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Find User
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Verify Password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Create Session
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_temp_password: user.is_temp_password
    });

    return NextResponse.json({ 
      success: true, 
      redirect: user.is_temp_password ? '/admin/change-password' : '/admin/dashboard' 
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
