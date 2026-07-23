'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bcvRate, setBcvRate] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchBcv();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (err) {}
  };

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) {
        setBcvRate(data.promedio);
      }
    } catch (err) {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isAdmin = user?.rol === 'ADMIN';

  const hasAccess = (moduleKey) => {
    if (user && Array.isArray(user.permisos) && user.permisos.length > 0) {
      return user.permisos.includes(moduleKey);
    }
    if (user?.rol === 'ADMIN') return true;
    return ['inicio', 'perfil', 'pos', 'inventario', 'creditos', 'clientes'].includes(moduleKey);
  };

  const showComprasSection = hasAccess('proveedores') || hasAccess('compras') || hasAccess('lotes');
  const showVentasSection = hasAccess('pos') || hasAccess('inventario') || hasAccess('creditos') || hasAccess('clientes');
  const showFinanzasSection = hasAccess('productos') || hasAccess('pagos_proveedores') || hasAccess('reportes') || hasAccess('auditoria') || hasAccess('usuarios');

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      
      {/* Top Header & Brand */}
      <div>
        <div style={{ padding: '0.5rem 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.1rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
              I
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.04em', color: '#ffffff' }}>
                INVENTARIO
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', marginTop: '2px' }}>
                {isAdmin ? 'ADMINISTRACIÓN' : 'VENTAS & BS'}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mobile-close-btn"
            title="Cerrar Menú"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          
          <div className="sidebar-section-title">INICIO</div>

          {hasAccess('inicio') && (
            <Link href="/inicio" onClick={onClose} className={`sidebar-link ${pathname === '/inicio' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Inicio</span>
            </Link>
          )}

          {hasAccess('perfil') && (
            <Link href="/perfil" onClick={onClose} className={`sidebar-link ${pathname === '/perfil' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Mi Perfil</span>
            </Link>
          )}

          {showVentasSection && (
            <>
              <div className="sidebar-section-title">OPERACIONES</div>

              {hasAccess('pos') && (
                <Link href="/trabajador/pos" onClick={onClose} className={`sidebar-link ${pathname === '/trabajador/pos' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>Punto de Venta</span>
                </Link>
              )}

              {hasAccess('inventario') && (
                <Link href="/trabajador/inventario" onClick={onClose} className={`sidebar-link ${pathname === '/trabajador/inventario' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Inventario</span>
                </Link>
              )}

              {hasAccess('clientes') && (
                <Link href="/admin/clientes" onClick={onClose} className={`sidebar-link ${pathname === '/admin/clientes' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="16" cy="3.13" r="4" />
                  </svg>
                  <span>Clientes</span>
                </Link>
              )}

              {hasAccess('creditos') && (
                <Link href="/trabajador/creditos" onClick={onClose} className={`sidebar-link ${pathname === '/trabajador/creditos' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>Créditos</span>
                </Link>
              )}
            </>
          )}

          {showComprasSection && (
            <>
              <div className="sidebar-section-title">COMPRAS Y ABASTO</div>

              {hasAccess('proveedores') && (
                <Link href="/admin/proveedores" onClick={onClose} className={`sidebar-link ${pathname === '/admin/proveedores' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Proveedores</span>
                </Link>
              )}

              {hasAccess('compras') && (
                <Link href="/admin/compras" onClick={onClose} className={`sidebar-link ${pathname === '/admin/compras' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Compras</span>
                </Link>
              )}

              {hasAccess('lotes') && (
                <Link href="/admin/lotes" onClick={onClose} className={`sidebar-link ${pathname === '/admin/lotes' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 17 22 12" />
                  </svg>
                  <span>Lotes</span>
                </Link>
              )}
            </>
          )}

          {showFinanzasSection && (
            <>
              <div className="sidebar-section-title">ADMINISTRACIÓN</div>

              {hasAccess('productos') && (
                <Link href="/admin/productos" onClick={onClose} className={`sidebar-link ${pathname === '/admin/productos' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Productos</span>
                </Link>
              )}

              {hasAccess('pagos_proveedores') && (
                <Link href="/admin/pagos-proveedores" onClick={onClose} className={`sidebar-link ${pathname === '/admin/pagos-proveedores' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>Pagos Proveedores</span>
                </Link>
              )}

              {hasAccess('reportes') && (
                <Link href="/admin/reportes" onClick={onClose} className={`sidebar-link ${pathname === '/admin/reportes' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>Reportes</span>
                </Link>
              )}

              {hasAccess('auditoria') && (
                <Link href="/admin/auditoria" onClick={onClose} className={`sidebar-link ${pathname === '/admin/auditoria' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Auditoría</span>
                </Link>
              )}

              {hasAccess('usuarios') && (
                <Link href="/admin/usuarios" onClick={onClose} className={`sidebar-link ${pathname === '/admin/usuarios' ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="16" cy="3.13" r="4" />
                  </svg>
                  <span>Usuarios</span>
                </Link>
              )}
            </>
          )}

        </nav>
      </div>

      {/* Bottom Profile Widget */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', marginTop: '1rem' }}>
        {user && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.nombre}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                {user.rol === 'ADMIN' ? 'Administrador' : 'Trabajador'}
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="btn"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', color: '#fb7185', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(225, 29, 72, 0.3)', background: 'rgba(225, 29, 72, 0.1)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </div>

    </aside>
  );
}
