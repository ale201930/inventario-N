'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast } from '@/components/CustomNotification';

export default function AdminProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    rif_identificacion: '',
    razon_social: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores');
      const data = await res.json();
      if (Array.isArray(data)) setProveedores(data);
    } catch (err) {
      showToast('Error cargando proveedores', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ rif_identificacion: '', razon_social: '', telefono: '', email: '', direccion: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      rif_identificacion: p.rif_identificacion,
      razon_social: p.razon_social,
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/proveedores/${editingId}` : '/api/proveedores';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      showToast(editingId ? 'Proveedor actualizado' : 'Proveedor creado exitosamente', 'success');
      setShowModal(false);
      fetchProveedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = proveedores.filter(p => 
    p.razon_social.toLowerCase().includes(search.toLowerCase()) || 
    p.rif_identificacion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Gestión de Proveedores</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Directorio de casas comerciales y distribuidores mayoristas de abasto.
            </p>
          </div>

          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            Nuevo Proveedor
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '1rem' }}>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por RIF o Razón Social..." 
            className="input-field" 
            style={{ maxWidth: '380px' }}
          />
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>RIF / Identificación</th>
                <th style={{ padding: '1rem' }}>Razón Social</th>
                <th style={{ padding: '1rem' }}>Teléfono</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Dirección</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{p.rif_identificacion}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>{p.razon_social}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{p.telefono || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{p.email || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.direccion || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button onClick={() => handleOpenEdit(p)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay proveedores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0f172a' }}>{editingId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>RIF / Identificación Fiscal *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.rif_identificacion} 
                  onChange={(e) => setFormData({ ...formData, rif_identificacion: e.target.value })} 
                  placeholder="Ej: J-12345678-0" 
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Razón Social / Nombre Comercial *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.razon_social} 
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} 
                  placeholder="Ej: Distribuidora Los Andes C.A." 
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Teléfono Contacto</label>
                  <input 
                    type="text" 
                    value={formData.telefono} 
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
                    placeholder="Ej: 0414-1234567" 
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="contacto@proveedor.com" 
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Dirección Fiscal / Almacén</label>
                <textarea 
                  rows="2" 
                  value={formData.direccion} 
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} 
                  placeholder="Ej: Zona Industrial I, Calle 4, Barquisimeto" 
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
