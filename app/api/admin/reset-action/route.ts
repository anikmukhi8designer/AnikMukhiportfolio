
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession, hashPassword, generateTempPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { request_id, action } = await req.json();

    if (action === 'reject') {
        await supabaseAdmin
            .from('password_reset_requests')
            .update({ 
                status: 'rejected', 
                processed_at: new Date().toISOString(),
                processed_by: session.id 
            })
            .eq('id', request_id);
        return NextResponse.json({ success: true, status: 'rejected' });
    }

    if (action === 'approve') {
        const { data: request } = await supabaseAdmin
            .from('password_reset_requests')
            .select('user_id')
            .eq('id', request_id)
            .single();
        
        if (!request) throw new Error("Request not found");

        const tempPassword = generateTempPassword();
        const hash = await hashPassword(tempPassword);

        await supabaseAdmin.from('auth_users').update({
                password_hash: hash,
                is_temp_password: true,
                updated_at: new Date().toISOString()
            }).eq('id', request.user_id);

        await supabaseAdmin.from('password_reset_requests').update({ 
                status: 'approved', 
                processed_at: new Date().toISOString(),
                processed_by: session.id
            }).eq('id', request_id);

        return NextResponse.json({ success: true, status: 'approved', temp_password: tempPassword });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
