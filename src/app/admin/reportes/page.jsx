'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminReportsPage() {
  const [rango, setRango] = useState('mes');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [rango]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/reportes?rango=${rango}`);
      const result = await res.json();
      setData(result);
    } catch (err) {}
  };

  const resumen = data?.resumen || {};
  const topRotacion = data?.topRotacion || [];
  const menorRotacion = data?.menorRotacion || [];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Reportes e Inteligencia de Negocio</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Cálculo de ganancias brutas, pérdidas por mermas e indicadores de rotación.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '0.4rem 0.6rem', display: 'flex', gap: '0.4rem' }}>
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Última Semana' },
              { id: 'mes', label: 'Último Mes' },
              { id: 'todo', label: 'Histórico Total' }
            ].map(b => (
              <button key={b.id} onClick={() => setRango(b.id)} className={`btn ${rango === b.id ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Ingresos por Ventas</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e1b4b' }}>${Number(resumen.totalVentas || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>{resumen.totalTransacciones || 0} transacciones emitidas</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #a7f3d0', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Ganancia Bruta Real</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>${Number(resumen.gananciaBruta || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>Ventas menos costos</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #fecdd3', borderLeft: '4px solid #e11d48' }}>
            <div style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 700, textTransform: 'uppercase' }}>Balance de Pérdidas</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#e11d48' }}>${Number(resumen.totalPerdidas || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>{resumen.unidadesPerdidas || 0} unidades mermadas</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#7c3aed', marginBottom: '1rem', fontWeight: 700 }}>Productos de Mayor Rotación</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e9d5ff', color: '#6d28d9', textAlign: 'left', background: '#f3e8ff' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Producto</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Unidades</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topRotacion.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', background: '#f3e8ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 700 }}>PROD</span>}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{p.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#7c3aed' }}>{p.total_vendido} unids</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>${Number(p.ingresos_generados).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#d97706', marginBottom: '1rem', fontWeight: 700 }}>Productos de Menor Rotación</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e9d5ff', color: '#6d28d9', textAlign: 'left', background: '#f3e8ff' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Producto</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Vendidos</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                {menorRotacion.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', background: '#f3e8ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 700 }}>PROD</span>}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{p.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#d97706' }}>{p.total_vendido} unids</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>{p.stock_actual} en almacén</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
