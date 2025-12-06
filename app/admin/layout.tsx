
import React from 'react';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {children}
      <Toaster position="top-center" />
    </div>
  );
}
