'use client';

import { useEffect } from 'react';
import { getPendingSales, removePendingSale } from '@/lib/offlineStore';

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[Service Worker] Registrado correctamente:', reg.scope))
        .catch((err) => console.warn('[Service Worker] Error al registrar:', err));
    }

    const syncOfflineTransactions = async () => {
      if (!navigator.onLine) return;
      try {
        const pending = await getPendingSales();
        if (pending.length > 0) {
          console.log(`[PWA Sync] Sincronizando ${pending.length} ventas offline...`);
          const res = await fetch('/api/ventas/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pendingSales: pending })
          });
          const data = await res.json();
          if (data.syncedIds && data.syncedIds.length > 0) {
            for (const id of data.syncedIds) {
              await removePendingSale(id);
            }
            console.log('[PWA Sync] Sincronización completada con éxito.');
          }
        }
      } catch (err) {
        console.error('[PWA Sync] Error durante la sincronización:', err);
      }
    };

    window.addEventListener('online', syncOfflineTransactions);
    syncOfflineTransactions();

    return () => window.removeEventListener('online', syncOfflineTransactions);
  }, []);

  return null;
}
