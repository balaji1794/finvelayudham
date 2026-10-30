'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reloading, setReloading] = useState(false);

  const handleHardReload = () => {
    setReloading(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('finvelayudham_chunk_reload');
        sessionStorage.removeItem('finvelayudham_chunk_reload_count');
        sessionStorage.removeItem('fv_chunk_reload');
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          });
        }
      } catch {}
      window.location.href = window.location.origin + window.location.pathname + '?_fresh=' + Date.now();
    }
  };

  useEffect(() => {
    console.error('Captured client application error:', error);

    // Auto-reload on chunk load failure (stale cache after new deployment)
    const isChunkError =
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      try {
        const reloadCountKey = 'finvelayudham_chunk_reload_count';
        const count = Number(sessionStorage.getItem(reloadCountKey) || '0');
        const now = Date.now();
        // Automatically hard refresh up to 2 times to fetch fresh chunks from new deployment
        if (count < 2) {
          sessionStorage.setItem(reloadCountKey, String(count + 1));
          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => caches.delete(name));
            });
          }
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              for (const registration of registrations) {
                registration.unregister();
              }
            });
          }
          window.location.href = window.location.origin + window.location.pathname + '?_fresh=' + now;
          return;
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            A temporary client exception occurred. We have safely preserved your encrypted session.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleHardReload}
            disabled={reloading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
            {reloading ? 'Refreshing...' : 'Reload Page'}
          </button>

          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold text-xs hover:bg-muted transition-all cursor-pointer"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold text-xs hover:bg-muted transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>

        {/* Technical details for debugging */}
        {error?.message && (
          <details className="text-left pt-2 border-t border-border/80">
            <summary className="text-[11px] font-mono text-muted-foreground cursor-pointer hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 p-3 bg-muted/60 rounded-lg text-[10px] text-destructive overflow-x-auto font-mono whitespace-pre-wrap break-all max-h-36">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ''}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
