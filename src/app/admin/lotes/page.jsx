'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminLotesPage() {
  const [lotes, setLotes] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLotes();
  }, []);

  const fetchLotes = async () => {
    try {
      const res = await fetch('/api/lotes');
      const data = await res.json();
      if (Array.isArray(data)) setLotes(data);
    } catch (err) {}
  };

  const filtered = lotes.filter(l => 
    (l.producto_nombre && l.producto_nombre.toLowerCase().includes(search.toLowerCase())) ||
    (l.codigo_lote && l.codigo_lote.toLowerCase().includes(search.toLowerCase())) ||
    (l.proveedor_nombre && l.proveedor_nombre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Control de Lotes & Trazabilidad FIFO</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Monitoreo de entradas de mercancía por lote, disponibilidad restante y alertas de vencimiento.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem' }}>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por lote, producto o proveedor..." 
            className="input-field" 
            style={{ maxWidth: '400px' }}
          />
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>Código Lote</th>
                <th style={{ padding: '1rem' }}>Producto</th>
                <th style={{ padding: '1rem' }}>Proveedor</th>
                <th style={{ padding: '1rem' }}>Costo Unitario ($)</th>
                <th style={{ padding: '1rem' }}>Ingresado</th>
                <th style={{ padding: '1rem' }}>Disponible</th>
                <th style={{ padding: '1rem' }}>Vencimiento</th>
                <th style={{ padding: '1rem' }}>Estado Lote</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const isAgotado = l.cantidad_disponible <= 0;
                const isPorVencer = l.fecha_vencimiento && new Date(l.fecha_vencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {l.codigo_lote}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      {l.producto_nombre}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {l.proveedor_nombre || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#059669' }}>
                      ${Number(l.precio_costo_unitario).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {l.cantidad_ingresada} unids
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: isAgotado ? '#e11d48' : '#2563eb' }}>
                      {l.cantidad_disponible} unids
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: isPorVencer ? '#d97706' : '#64748b' }}>
                      {l.fecha_vencimiento ? new Date(l.fecha_vencimiento).toLocaleDateString() : 'Sin Vencimiento'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isAgotado ? 'badge-danger' : isPorVencer ? 'badge-warning' : 'badge-success'}`}>
                        {isAgotado ? 'Agotado' : isPorVencer ? 'Próximo a Vencer' : 'Disponible'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay lotes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}
