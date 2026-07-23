'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast, showConfirm } from '@/components/CustomNotification';

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    cedula_rif: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      if (Array.isArray(data)) setClientes(data);
    } catch (err) {
      showToast('Error al cargar la lista de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        cedula_rif: client.cedula_rif || '',
        nombre: client.nombre || '',
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        cedula_rif: '',
        nombre: '',
        telefono: '',
        email: '',
        direccion: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cedula_rif || !formData.nombre) {
      showToast('La Cédula/RIF y el Nombre son obligatorios', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editingClient ? `/api/clientes/${editingClient.id}` : '/api/clientes';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error procesando solicitud');

      showToast(editingClient ? 'Cliente actualizado correctamente' : 'Cliente registrado exitosamente', 'success');
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (client) => {
    showConfirm({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de eliminar a ${client.nombre} (${client.cedula_rif})?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/clientes/${client.id}`, { method: 'DELETE' });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Error eliminando cliente');
          }
          showToast('Cliente eliminado correctamente', 'success');
          fetchClientes();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const formatWhatsAppPhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '58' + cleaned.substring(1);
    } else if (!cleaned.startsWith('58') && (cleaned.length === 10 || cleaned.length === 11)) {
      if (cleaned.length === 10) cleaned = '58' + cleaned;
    }
    return cleaned;
  };

  const filteredClientes = clientes.filter(c => {
    const q = search.toLowerCase();
    return (c.nombre || '').toLowerCase().includes(q) ||
           (c.cedula_rif || '').toLowerCase().includes(q) ||
           (c.telefono || '').toLowerCase().includes(q) ||
           (c.direccion || '').toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b' }}>Módulo de Clientes</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Gestión centralizada de compradores registrados para facturación, crédito y envíos por WhatsApp.
            </p>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.9rem' }}
          >
            + Nuevo Cliente
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="kpi-card">
            <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              TOTAL CLIENTES REGISTRADOS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              {clientes.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Compradores guardados en la base de datos
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              CONTACTOS CON WHATSAPP
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>
              {clientes.filter(c => c.telefono).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Habilitados para facturación digital
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem' }}>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por Cédula/RIF, nombre, teléfono o dirección..."
            className="input-field"
          />
        </div>

        {/* Clients Table */}
        <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', color: '#1e40af', background: '#eff6ff' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Cédula / RIF</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nombre / Razón Social</th>
                <th style={{ padding: '0.75rem 1rem' }}>Teléfono</th>
                <th style={{ padding: '0.75rem 1rem' }}>Dirección</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(client => {
                const cleanPhone = formatWhatsAppPhone(client.telefono);

                return (
                  <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                      {client.cedula_rif}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {client.nombre}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {client.telefono ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{client.telefono}</span>
                          <a 
                            href={`https://wa.me/${cleanPhone}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none' }}
                            title="Chat WhatsApp"
                          >
                            📲 Chat
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin teléfono</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.direccion || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin dirección</span>}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleOpenModal(client)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#2563eb', borderColor: '#bfdbfe' }}
                        >
                          ✏️ Editar
                        </button>

                        <button 
                          onClick={() => handleDelete(client)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClientes.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron clientes registrados con esa búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Crear / Editar Cliente */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '1rem' }}>
              {editingClient ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Cédula / RIF *
                </label>
                <input 
                  type="text"
                  required
                  value={formData.cedula_rif}
                  onChange={(e) => setFormData({ ...formData, cedula_rif: e.target.value })}
                  placeholder="Ej. V-12345678 o 12345678"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Nombre y Apellido / Razón Social *
                </label>
                <input 
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. María Pérez"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Teléfono (WhatsApp)
                </label>
                <input 
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej. 0412-1234567"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Correo Electrónico (Opcional)
                </label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Dirección de Habitación / Entrega
                </label>
                <input 
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej. Calle Principal, Casa #4"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, fontWeight: 700 }}>
                  {saving ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
