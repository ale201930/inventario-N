'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMainMenu = pathname === '/inicio';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {isMainMenu ? (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
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

          {/* Main Menu View with Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div 
            className="main-content-wrapper" 
            style={{ flex: 1, marginLeft: '280px', minHeight: '100vh', display: 'flex', flexDirection: 'column', width: 'calc(100% - 280px)' }}
          >
            {/* Mobile Header Bar */}
            <header className="mobile-header" style={{ display: 'none', background: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.75rem 1rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)', position: 'sticky', top: 0, zIndex: 990 }}>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '1.25rem', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px' }}
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
              <div style={{ width: '40px' }} />
            </header>

            <main className="app-main-content" style={{ flex: 1, padding: '1.75rem', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Full Screen Module View - Top Bar with Blue "← Volver" Button on Right */}
          <header style={{
            background: '#0f172a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.75rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Top Left Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}>
                INV
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', letterSpacing: '0.04em' }}>
                INVENTARIO
              </div>
            </div>

            {/* Top Right Vibrant Blue "← Volver" Button */}
            <button 
              onClick={() => router.push('/inicio')}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                padding: '0.55rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>←</span>
              <span>Volver</span>
            </button>
          </header>

          {/* Full-width Main Module Content */}
          <main className="app-main-content" style={{ flex: 1, padding: '1.75rem 2.25rem', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
            {children}
          </main>
        </div>
      )}

    </div>
  );
}
