
import { NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';
import { getSession, hashPassword, generateTempPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { request_id, action } = await req.json(); // action: 'approve' | 'reject'

    if (action === 'reject') {
        await supabase
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
        // 1. Get Request details
        const { data: request } = await supabase
            .from('password_reset_requests')
            .select('user_id')
            .eq('id', request_id)
            .single();
        
        if (!request) throw new Error("Request not found");

        // 2. Generate new temp pass
        const tempPassword = generateTempPassword();
        const hash = await hashPassword(tempPassword);

        // 3. Update User
        await supabase
            .from('auth_users')
            .update({
                password_hash: hash,
                is_temp_password: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', request.user_id);

        // 4. Update Request
        await supabase
            .from('password_reset_requests')
            .update({ 
                status: 'approved', 
                processed_at: new Date().toISOString(),
                processed_by: session.id
            })
            .eq('id', request_id);

        return NextResponse.json({ 
            success: true, 
            status: 'approved',
            temp_password: tempPassword // Send back to Super Admin to communicate to user
        });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
