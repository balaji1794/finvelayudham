'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
    if (
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch dynamically imported module')
    ) {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#121212] font-sans p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 font-serif">FinVelayudham</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            A new application build is available. Click below to load the updated version.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#2C6E49] text-white text-xs font-bold rounded-xl shadow hover:bg-[#245a3b] cursor-pointer"
            >
              Reload Page
            </button>
            <button
              onClick={() => reset()}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
