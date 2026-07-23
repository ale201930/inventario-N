'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isAdmin = user?.rol === 'ADMIN';

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.75rem 1.5rem', position: 'sticky', top: 0, zIndex: 100, background: '#ffffff', borderBottom: '1px solid #dbeafe' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>INV</span>
            <span style={{ color: '#0f172a' }}>
              Sistema de <span style={{ color: '#2563eb' }}>Inventario</span>
            </span>
          </div>

          {/* Network Connection Status */}
          <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#059669' : '#e11d48' }}></span>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
        </div>

        {/* Navigation Links according to Role */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAdmin ? (
            <>
              <Link href="/admin/productos" className={`btn ${pathname.startsWith('/admin/productos') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Productos
              </Link>
              <Link href="/admin/usuarios" className={`btn ${pathname.startsWith('/admin/usuarios') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Usuarios
              </Link>
              <Link href="/admin/auditoria" className={`btn ${pathname.startsWith('/admin/auditoria') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Auditoría
              </Link>
              <Link href="/admin/reportes" className={`btn ${pathname.startsWith('/admin/reportes') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Reportes
              </Link>
            </>
          ) : (
            <>
              <Link href="/trabajador/pos" className={`btn ${pathname.startsWith('/trabajador/pos') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Ventas
              </Link>
              <Link href="/trabajador/inventario" className={`btn ${pathname.startsWith('/trabajador/inventario') ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.85rem' }}>
                Catálogo
              </Link>
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{user.nombre}</div>
              <span className={`badge ${isAdmin ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                {user.rol}
              </span>
            </div>
          )}

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#e11d48' }}>
            Salir
          </button>
        </div>

      </div>
    </header>
  );
}
