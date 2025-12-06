
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession, hashPassword, generateTempPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, full_name, role } = await req.json();
    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    const { data, error } = await supabaseAdmin
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

    return NextResponse.json({ success: true, user: data, temp_password: tempPassword });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
