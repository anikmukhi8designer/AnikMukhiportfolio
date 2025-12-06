
import { NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';
import { getSession, hashPassword, generateTempPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, full_name, role } = await req.json();

    // 1. Generate Temp Password
    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    // 2. Insert User
    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email,
        full_name,
        role,
        password_hash: hash,
        is_temp_password: true
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Return temp password to Super Admin (to copy/share)
    return NextResponse.json({ 
        success: true, 
        user: data,
        temp_password: tempPassword 
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
