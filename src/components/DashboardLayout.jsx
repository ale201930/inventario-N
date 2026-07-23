'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar automatically whenever route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
        
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="sidebar-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1040,
              cursor: 'pointer'
            }}
          />
        )}

        {/* Sidebar Component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Wrapper */}
        <div 
          className="main-content-wrapper" 
          style={{ flex: 1, marginLeft: '280px', minHeight: '100vh', display: 'flex', flexDirection: 'column', width: 'calc(100% - 280px)', transition: 'margin-left 0.3s ease' }}
        >
          {/* Top Header Bar for Mobile & Tablet */}
          <header className="mobile-header" style={{ display: 'none', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 990 }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '1.25rem', background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
              title="Abrir Menú"
            >
              ☰
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>
                INV
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', letterSpacing: '0.04em' }}>INVENTARIO</span>
            </div>

            {pathname !== '/inicio' ? (
              <button 
                onClick={() => router.push('/inicio')}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ← Inicio
              </button>
            ) : (
              <div style={{ width: '40px' }} />
            )}
          </header>

          {/* Main Content Body */}
          <main className="app-main-content" style={{ flex: 1, padding: '1.75rem', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
            {children}
          </main>
        </div>

      </div>

    </div>
  );
}
