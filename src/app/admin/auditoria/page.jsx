'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductModal from '@/components/ProductModal';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bcvRate, setBcvRate] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchBcv();
  }, [tipoFilter, fechaFilter]);

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) setBcvRate(data.promedio);
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const url = new URL('/api/auditoria', window.location.origin);
      if (tipoFilter) url.searchParams.set('tipo', tipoFilter);
      if (fechaFilter) url.searchParams.set('fecha', fechaFilter);

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Bitácora de Auditoría Diaria</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Historial de movimientos de mercancía registrado por hora, miniatura visual y usuario.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="input-field" style={{ width: 'auto' }}>
              <option value="">Todos los Movimientos</option>
              <option value="ENTRADA">Entradas de Stock</option>
              <option value="SALIDA">Salidas (Ventas)</option>
              <option value="PERDIDA">Pérdidas / Mermas</option>
            </select>

            <input type="date" value={fechaFilter} onChange={(e) => setFechaFilter(e.target.value)} className="input-field" style={{ width: 'auto' }} />
          </div>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e9d5ff', background: '#f3e8ff', color: '#6d28d9' }}>
                <th style={{ padding: '1rem' }}>Hora / Fecha</th>
                <th style={{ padding: '1rem' }}>Tipo Movimiento</th>
                <th style={{ padding: '1rem' }}>Producto (Miniatura)</th>
                <th style={{ padding: '1rem' }}>Cantidad</th>
                <th style={{ padding: '1rem' }}>Justificación / Concepto</th>
                <th style={{ padding: '1rem' }}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isEntrada = log.tipo_movimiento === 'ENTRADA';
                const isSalida = log.tipo_movimiento === 'SALIDA';
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#1e1b4b' }}>
                        {new Date(log.fecha_movimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(log.fecha_movimiento).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isEntrada ? 'badge-success' : isSalida ? 'badge-info' : 'badge-danger'}`}>
                        {isEntrada ? 'ENTRADA' : isSalida ? 'SALIDA' : 'PERDIDA'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          onClick={() => setSelectedProduct({ nombre: log.producto_nombre, imagen_url: log.producto_imagen, codigo_barras: log.codigo_barras })}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#f3e8ff', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {log.producto_imagen ? (
                            <img src={log.producto_imagen} alt={log.producto_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700 }}>PROD</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e1b4b' }}>{log.producto_nombre}</div>
                          {log.codigo_barras && (
                            <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontFamily: 'monospace' }}>{log.codigo_barras}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: isEntrada ? '#059669' : isSalida ? '#7c3aed' : '#e11d48' }}>
                        {isEntrada ? `+${log.cantidad}` : `-${log.cantidad}`} unids
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {log.justificacion || 'Sin justificación especificada'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e1b4b' }}>{log.usuario_nombre || 'Sistema'}</div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{log.usuario_rol || 'USER'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} bcvRate={bcvRate} />}
    </DashboardLayout>
  );
}
