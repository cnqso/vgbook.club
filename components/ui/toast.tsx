'use client';

import { Toaster } from 'react-hot-toast';
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
        },
        icon: <></>,
      }}
    />
  );
}
