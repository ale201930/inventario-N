'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardInicioPage() {
  const [user, setUser] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [products, setProducts] = useState([]);
  const [bcvRate, setBcvRate] = useState(737.88);
  const [creditos, setCreditos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    fetch('/api/bcv')
      .then(res => res.json())
      .then(data => {
        if (data && data.promedio) setBcvRate(data.promedio);
      })
      .catch(() => {});

    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    fetch('/api/creditos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCreditos(data);
      })
      .catch(() => {});

    fetch('/api/compras')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCompras(data);
      })
      .catch(() => {});

    fetch('/api/reportes?rango=todo')
      .then(res => res.json())
      .then(data => {
        setReportData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resumen = reportData?.resumen || {};
  const topRotacion = reportData?.topRotacion || [];
  const menorRotacion = reportData?.menorRotacion || [];

  const isAdmin = user?.rol === 'ADMIN';

  // Advanced Metric Calculations
  const valorInventarioUsd = products.reduce((sum, p) => sum + (Number(p.stock_actual || 0) * Number(p.precio_costo || 0)), 0);
  const valorVentaInventarioUsd = products.reduce((sum, p) => sum + (Number(p.stock_actual || 0) * Number(p.precio_venta || 0)), 0);
  const totalProductosRegistrados = products.length;
  const productosCriticos = products.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo));
  const productosAgotados = products.filter(p => Number(p.stock_actual) <= 0);

  const totalCxcPendienteUsd = creditos
    .filter(c => c.estado !== 'CANCELADO')
    .reduce((sum, c) => sum + Number(c.monto_pendiente || 0), 0);

  const totalCxpPendienteUsd = compras
    .filter(c => c.estado_pago === 'PENDIENTE')
    .reduce((sum, c) => sum + Number(c.monto_total_usd || 0), 0);

  const totalVentasUsd = Number(resumen.totalVentas || 0);
  const totalVentasBs = totalVentasUsd * bcvRate;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Welcome Header Banner */}
        <div className="welcome-banner">
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bfdbfe', marginBottom: '0.4rem' }}>
              {isAdmin ? 'PANEL DE INTELIGENCIA Y ESTADÍSTICAS DEL SISTEMA' : 'MÓDULO DE MONITOREO DE VENTAS'}
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Bienvenido, <span style={{ color: '#eff6ff' }}>{user?.nombre || 'Usuario'}</span>
            </h1>
            <p style={{ color: '#eff6ff', fontSize: '0.92rem', marginTop: '0.4rem', maxWidth: '700px', lineHeight: 1.5 }}>
              Consola centralizada de métricas de facturación, valorización de inventario, cuentas por cobrar y rotación de mercancías.
            </p>
          </div>
        </div>

        {/* Section 1: Main Financial Metrics Grid */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '5px', height: '22px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', borderRadius: '3px', display: 'inline-block' }}></span>
              Indicadores Principales de Facturación
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            
            {/* Total Facturado USD */}
            <div className="kpi-card">
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                TOTAL FACTURADO ($ USD)
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                ${totalVentasUsd.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {resumen.totalTransacciones || 0} tickets emitidos
              </div>
            </div>

            {/* Facturado equivalente en Bolívares */}
            <div className="kpi-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                FACTURACIÓN EN BOLÍVARES (BS.)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '0.2rem 0' }}>
                Bs. {totalVentasBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Convertido a Tasa BCV Oficial
              </div>
            </div>

            {/* Admin Exclusive: Ganancia Bruta Real */}
            {isAdmin && (
              <div className="kpi-card" style={{ borderLeft: '4px solid #059669' }}>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  GANANCIA BRUTA REAL
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', margin: '0.2rem 0' }}>
                  ${Number(resumen.gananciaBruta || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Margen neto (Ventas - Costos)
                </div>
              </div>
            )}

            {/* Admin Exclusive: Pérdidas acumuladas */}
            {isAdmin && (
              <div className="kpi-card" style={{ borderLeft: '4px solid #e11d48' }}>
                <div style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  PÉRDIDAS POR MERMAS
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#e11d48', margin: '0.2rem 0' }}>
                  ${Number(resumen.totalPerdidas || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {resumen.unidadesPerdidas || 0} unidades descartadas
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Section 2: Inventory Valuation & Operational Statistics */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '5px', height: '22px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', borderRadius: '3px', display: 'inline-block' }}></span>
              Valorización de Almacén y Estado de Cuentas
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
            
            {/* Valor de Inventario al Costo */}
            <div className="kpi-card">
              <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                VALOR DE STOCK (AL COSTO)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                ${valorInventarioUsd.toFixed(2)} USD
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Costo total de inversión en almacén
              </div>
            </div>

            {/* Proyección de Valor a Precio de Venta */}
            <div className="kpi-card">
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                PROYECTADO A PRECIO DE VENTA
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', margin: '0.2rem 0' }}>
                ${valorVentaInventarioUsd.toFixed(2)} USD
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Retorno estimado al vender todo el stock
              </div>
            </div>

            {/* Cuentas por Cobrar Pendientes CxC */}
            <div className="kpi-card">
              <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                CUENTAS POR COBRAR (CxC)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', margin: '0.2rem 0' }}>
                ${totalCxcPendienteUsd.toFixed(2)} USD
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Saldo adeudado por clientes a crédito
              </div>
            </div>

            {/* Cuentas por Pagar a Proveedores CxP */}
            {isAdmin && (
              <div className="kpi-card">
                <div style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  CUENTAS POR PAGAR (CxP)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e11d48', margin: '0.2rem 0' }}>
                  ${totalCxpPendienteUsd.toFixed(2)} USD
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Facturas pendientes a distribuidores
                </div>
              </div>
            )}

            {/* Resumen de Catálogo & Stock Crítico */}
            <div className="kpi-card">
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                CATÁLOGO & ALERTAS
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                {totalProductosRegistrados} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>productos</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>
                {productosCriticos.length} en stock crítico ({productosAgotados.length} agotados)
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Rotation Analytics Tables (Top Sales & Lowest Movement) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Top Products Table */}
          <div className="glass-panel" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#2563eb', fontWeight: 800 }}>
                Productos de Mayor Rotación (Más Vendidos)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #dbeafe', color: '#1e40af', background: '#eff6ff' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Producto</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Unidades</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Ingresos ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {topRotacion.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', overflow: 'hidden', background: '#eff6ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700 }}>PROD</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.nombre}</div>
                            {p.codigo_barras && <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{p.codigo_barras}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                        {p.total_vendido} unids
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        ${Number(p.ingresos_generados).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {topRotacion.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        Sin registros de ventas en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Movement / Critical Stock Table */}
          <div className="glass-panel" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#d97706', fontWeight: 800 }}>
                Productos de Menor Rotación / Por Reabastecer
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #dbeafe', color: '#1e40af', background: '#eff6ff' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Producto</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Vendidos</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {menorRotacion.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', overflow: 'hidden', background: '#eff6ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700 }}>PROD</span>
                            )}
                          </div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#d97706' }}>
                        {p.total_vendido} unids
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, color: p.stock_actual <= 5 ? '#e11d48' : '#475569' }}>
                        {p.stock_actual} en almacén
                      </td>
                    </tr>
                  ))}
                  {menorRotacion.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        Sin registros en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
