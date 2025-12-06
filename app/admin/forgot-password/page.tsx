
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RequestReset() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus('loading');
      
      await fetch('/api/auth/request-reset', {
          method: 'POST',
          body: JSON.stringify({ email, reason }),
      });

      // Always show success for security
      setStatus('success');
  };

  if (status === 'success') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-neutral-200 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Request Sent</h2>
                <p className="text-neutral-500 mb-6">
                    If an account exists for <b>{email}</b>, a Super Admin will review your request.
                </p>
                <Link href="/admin/login" className="text-sm font-bold underline">Back to Login</Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl">
            <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6">
                <ArrowLeft className="w-4 h-4"/> Back
            </Link>
            
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reset Request</h1>
            <p className="text-sm text-neutral-500 mb-6">Submit a request to the Super Admin.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Email</label>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Reason (Optional)</label>
                    <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none"
                        placeholder="e.g. Locked out of account"
                    />
                </div>
                <button 
                    disabled={status === 'loading'}
                    className="w-full py-3 bg-neutral-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} 
                    Submit Request
                </button>
            </form>
        </div>
    </div>
  );
}
