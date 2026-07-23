'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast, showConfirm } from '@/components/CustomNotification';

const MODULE_CATEGORIES = [
  {
    title: 'INICIO Y MI PERFIL',
    modules: [
      { key: 'inicio', nombre: 'Inicio', desc: 'Panel principal de resumen y métricas' },
      { key: 'perfil', nombre: 'Mi Perfil', desc: 'Edición de credenciales e información propia' }
    ]
  },
  {
    title: 'COMPRAS Y ABASTO',
    modules: [
      { key: 'proveedores', nombre: 'Proveedores', desc: 'Directorio y gestión de casas comerciales' },
      { key: 'compras', nombre: 'Compras', desc: 'Ingreso de facturas y reabastecimiento' },
      { key: 'lotes', nombre: 'Control de Lotes', desc: 'Trazabilidad FIFO y fechas de vencimiento' }
    ]
  },
  {
    title: 'OPERACIONES DE VENTA',
    modules: [
      { key: 'pos', nombre: 'Ventas', desc: 'Facturación, cobros y emisión de tickets' },
      { key: 'inventario', nombre: 'Catálogo', desc: 'Galería de mercancías e imágenes' },
      { key: 'creditos', nombre: 'Créditos', desc: 'Cuentas por cobrar y registro de abonos' }
    ]
  },
  {
    title: 'FINANZAS Y CONTROL ADMINISTRATIVO',
    modules: [
      { key: 'productos', nombre: 'Productos', desc: 'Carga, edición de precios y stock general' },
      { key: 'pagos_proveedores', nombre: 'Cuentas por Pagar', desc: 'Saldar compras pendientes a distribuidores' },
      { key: 'reportes', nombre: 'Reportes Financieros', desc: 'Métricas de ventas, utilidades e informes' },
      { key: 'auditoria', nombre: 'Auditoría', desc: 'Historial detallado de movimientos de almacén' },
      { key: 'usuarios', nombre: 'Usuarios', desc: 'Alta de cuentas y matriz de accesos' }
    ]
  }
];

const DEFAULT_WORKER_PERMISSIONS = ['inicio', 'perfil', 'pos', 'inventario', 'creditos'];
const ALL_MODULE_KEYS = MODULE_CATEGORIES.flatMap(cat => cat.modules.map(m => m.key));

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'TRABAJADOR',
    activo: true,
    permisos: DEFAULT_WORKER_PERMISSIONS
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      showToast('Error cargando usuarios', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'TRABAJADOR',
      activo: true,
      permisos: [...DEFAULT_WORKER_PERMISSIONS]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingId(u.id);
    const existingPerms = Array.isArray(u.permisos) && u.permisos.length > 0
      ? u.permisos
      : (u.rol === 'ADMIN' ? ALL_MODULE_KEYS : DEFAULT_WORKER_PERMISSIONS);

    setFormData({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol || 'TRABAJADOR',
      activo: Boolean(u.activo),
      permisos: [...existingPerms]
    });
    setIsModalOpen(true);
  };

  const handleToggleModulePermission = (modKey) => {
    setFormData(prev => {
      const current = prev.permisos || [];
      const has = current.includes(modKey);
      const updated = has ? current.filter(k => k !== modKey) : [...current, modKey];
      return { ...prev, permisos: updated };
    });
  };

  const handleGrantAll = () => {
    setFormData(prev => ({ ...prev, permisos: [...ALL_MODULE_KEYS] }));
  };

  const handleGrantDefaultWorker = () => {
    setFormData(prev => ({ ...prev, permisos: [...DEFAULT_WORKER_PERMISSIONS] }));
  };

  const handleDenyAll = () => {
    setFormData(prev => ({ ...prev, permisos: [] }));
  };

  const handleRolChange = (newRol) => {
    setFormData(prev => ({
      ...prev,
      rol: newRol,
      permisos: newRol === 'ADMIN' ? [...ALL_MODULE_KEYS] : [...DEFAULT_WORKER_PERMISSIONS]
    }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Edit mode (PUT)
        const res = await fetch('/api/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password || undefined,
            rol: formData.rol,
            permisos: formData.permisos,
            activo: formData.activo
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error actualizando usuario');
        showToast('Usuario y accesos actualizados', 'success');
      } else {
        // Create mode (POST)
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            rol: formData.rol,
            permisos: formData.permisos
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error creando usuario');
        showToast('Usuario creado con permisos asignados', 'success');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, activo: !user.activo })
      });
      showToast(`Usuario ${user.activo ? 'desactivado' : 'activado'}`, 'info');
      fetchUsers();
    } catch (err) {}
  };

  const handleDeleteUser = (user) => {
    if (user.id === 1) {
      showToast('No se puede eliminar el usuario administrador principal del sistema', 'error');
      return;
    }

    showConfirm({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar permanentemente al usuario "${user.nombre}" (${user.email})?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/usuarios?id=${user.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');

          showToast(`Usuario "${user.nombre}" eliminado correctamente`, 'success');
          fetchUsers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b' }}>Gestión de Usuarios y Accesos</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Asignación de módulos, control de permisos y eliminación de cuentas.
            </p>
          </div>

          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>
            + Crear Usuario
          </button>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Nombre Completo</th>
                <th style={{ padding: '1rem' }}>Correo Electrónico</th>
                <th style={{ padding: '1rem' }}>Rol Principal</th>
                <th style={{ padding: '1rem' }}>Módulos Asignados</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const numPermisos = Array.isArray(u.permisos) ? u.permisos.length : 0;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                    <td style={{ padding: '1rem', color: '#64748b', fontFamily: 'monospace' }}>#{u.id}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{u.nombre}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.rol === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                        {u.rol === 'ADMIN' ? 'ADMINISTRADOR' : 'TRABAJADOR'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {numPermisos} de {ALL_MODULE_KEYS.length} Módulos
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                        {u.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          ✏️ Editar / Accesos
                        </button>
                        
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.activo ? 'btn-secondary' : 'btn-success'}`}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>

                        {u.id !== 1 && (
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', fontWeight: 700 }}
                            title="Eliminar usuario del sistema"
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', background: '#ffffff', border: '1px solid #dbeafe', boxShadow: '0 25px 60px rgba(30, 58, 138, 0.22)' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0f172a' }}>
              {editingId ? 'Editar Usuario y Accesos' : 'Alta de Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Basic Details Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre Completo *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                    placeholder="Ej. Carlos Ruiz"
                    className="input-field" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Correo Electrónico *</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="usuario@empresa.com"
                    className="input-field" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {editingId ? 'Contraseña (Opcional)' : 'Contraseña *'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingId} 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder={editingId ? 'Mantener contraseña actual' : '••••••••'}
                    className="input-field" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Rol Principal *</label>
                  <select 
                    value={formData.rol} 
                    onChange={(e) => handleRolChange(e.target.value)} 
                    className="input-field"
                  >
                    <option value="TRABAJADOR">Trabajador Operativo</option>
                    <option value="ADMIN">Administrador General</option>
                  </select>
                </div>
              </div>

              {/* Granular Module Access Matrix */}
              <div style={{ background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2563eb' }}>
                      Matriz de Accesos a Módulos
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Selecciona o desmarca los módulos que este trabajador podrá visualizar en su panel lateral.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={handleGrantAll} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}>
                      Otorgar Todos
                    </button>
                    <button type="button" onClick={handleGrantDefaultWorker} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}>
                      Vendedor Básico
                    </button>
                    <button type="button" onClick={handleDenyAll} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', color: '#ef4444' }}>
                      Denegar Todos
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {MODULE_CATEGORIES.map((cat, catIdx) => (
                    <div key={catIdx} style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#eff6ff', padding: '0.5rem 0.85rem', fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.05em' }}>
                        {cat.title}
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <tbody>
                          {cat.modules.map(mod => {
                            const isGranted = (formData.permisos || []).includes(mod.key);

                            return (
                              <tr key={mod.key} style={{ borderBottom: '1px solid #eff6ff' }}>
                                <td style={{ padding: '0.65rem 0.85rem', width: '40px', textAlign: 'center' }}>
                                  <input 
                                    type="checkbox"
                                    checked={isGranted}
                                    onChange={() => handleToggleModulePermission(mod.key)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                                  />
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a', width: '220px' }}>
                                  {mod.nombre}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                                  {mod.desc}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', width: '150px' }}>
                                  <span className={`badge ${isGranted ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                                    {isGranted ? 'Autorizado' : 'Denegado'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #dbeafe', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {loading ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
