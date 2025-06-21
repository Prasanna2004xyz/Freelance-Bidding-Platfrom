import { Toaster } from 'react-hot-toast';

export function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          color: '#e2e8f0',
          border: '1px solid rgba(226, 232, 240, 0.1)',
        },
      }}
    />
  );
} 