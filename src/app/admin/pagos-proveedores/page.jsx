'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast } from '@/components/CustomNotification';

export default function AdminPagosProveedoresPage() {
  const [compras, setCompras] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    fetchCompras();
    fetchPagos();
  }, []);

  const fetchCompras = async () => {
    try {
      const res = await fetch('/api/compras');
      const data = await res.json();
      if (Array.isArray(data)) setCompras(data);
    } catch (err) {}
  };

  const fetchPagos = async () => {
    try {
      const res = await fetch('/api/pagos-proveedores');
      const data = await res.json();
      if (Array.isArray(data)) setPagos(data);
    } catch (err) {}
  };

  const handleOpenPago = (c) => {
    setSelectedCompra(c);
    setMontoPago(c.monto_total_usd);
    setMetodoPago('EFECTIVO');
    setObservaciones('');
    setShowModal(true);
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!selectedCompra || Number(montoPago) <= 0) {
      showToast('Especifica un monto válido a pagar', 'error');
      return;
    }

    try {
      const res = await fetch('/api/pagos-proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compra_id: selectedCompra.id,
          monto_pagado: Number(montoPago),
          metodo_pago: metodoPago,
          observaciones
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar pago');

      showToast('Pago a proveedor registrado exitosamente', 'success');
      setShowModal(false);
      fetchCompras();
      fetchPagos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const comprasPendientes = compras.filter(c => 
    c.estado_pago === 'PENDIENTE' && 
    (c.proveedor_nombre.toLowerCase().includes(search.toLowerCase()) || 
     (c.numero_factura_proveedor && c.numero_factura_proveedor.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Cuentas por Pagar a Proveedores</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Gestión de facturas de compra pendientes por saldar y registro de pagos a distribuidores.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem' }}>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por proveedor o factura N°..." 
            className="input-field" 
            style={{ maxWidth: '380px' }}
          />
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>Factura N°</th>
                <th style={{ padding: '1rem' }}>Proveedor</th>
                <th style={{ padding: '1rem' }}>Fecha Factura</th>
                <th style={{ padding: '1rem' }}>Monto ($ USD)</th>
                <th style={{ padding: '1rem' }}>Estado Pago</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprasPendientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                    #{c.numero_factura_proveedor || c.id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                    {c.proveedor_nombre}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                    {new Date(c.fecha_compra).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#e11d48' }}>
                    ${Number(c.monto_total_usd).toFixed(2)} USD
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-warning">
                      PENDIENTE DE PAGO
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button onClick={() => handleOpenPago(c)} className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}>
                      Saldar Factura
                    </button>
                  </td>
                </tr>
              ))}
              {comprasPendientes.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay cuentas pendientes por pagar a proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showModal && selectedCompra && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0f172a' }}>Saldar Pago a Proveedor</h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Proveedor: <strong style={{ color: '#0f172a' }}>{selectedCompra.proveedor_nombre}</strong> (Factura #{selectedCompra.numero_factura_proveedor || selectedCompra.id})
            </div>

            <form onSubmit={handleSubmitPago} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Monto Pagado ($ USD) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={montoPago} 
                  onChange={(e) => setMontoPago(e.target.value)} 
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Método de Pago *</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="input-field"
                >
                  <option value="EFECTIVO">EFECTIVO ($ USD)</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
                  <option value="ZELLE">ZELLE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Observaciones / Comprobante</label>
                <input 
                  type="text" 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  placeholder="Ej. Transferencia N° 991204" 
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
