
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { email, reason } = await req.json();

    const { data: user } = await supabaseAdmin
      .from('auth_users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) return NextResponse.json({ success: true, message: 'If account exists, request sent.' });

    const { data: existing } = await supabaseAdmin
        .from('password_reset_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();
    
    if (existing) return NextResponse.json({ success: true, message: 'Request already pending.' });

    const { error } = await supabaseAdmin.from('password_reset_requests').insert({
        user_id: user.id,
        reason: reason || 'User requested reset via login screen',
        status: 'pending'
    });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
