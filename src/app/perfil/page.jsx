'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function UserProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mi Perfil de Usuario</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Información de la cuenta de acceso al sistema y rol asignado.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid #e9d5ff', paddingBottom: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#1e1b4b', fontWeight: 800 }}>{user?.nombre || 'Usuario'}</h2>
              <div style={{ marginTop: '0.2rem' }}>
                <span className={`badge ${user?.rol === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                  {user?.rol === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : 'TRABAJADOR OPERATIVO'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Correo Electrónico Registrado
              </label>
              <input type="text" readOnly value={user?.email || ''} className="input-field" style={{ background: '#faf9ff', color: '#1e1b4b', fontWeight: 600 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Estado de la Cuenta
              </label>
              <input type="text" readOnly value="Cuenta Activa (Permisos Concedidos)" className="input-field" style={{ background: '#faf9ff', color: '#059669', fontWeight: 600 }} />
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
