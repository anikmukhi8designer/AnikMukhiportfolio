
import { NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, reason } = await req.json();

    // 1. Check if user exists
    const { data: user } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email)
      .single();

    // Security: Always return success even if email not found to prevent enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If account exists, request sent.' });
    }

    // 2. Check for existing pending requests
    const { data: existing } = await supabase
        .from('password_reset_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();
    
    if (existing) {
        return NextResponse.json({ success: true, message: 'Request already pending.' });
    }

    // 3. Create Request
    const { error } = await supabase.from('password_reset_requests').insert({
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
