'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast } from '@/components/CustomNotification';

export default function AdminComprasPage() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [proveedorId, setProveedorId] = useState('');
  const [nroFactura, setNroFactura] = useState('');
  const [estadoPago, setEstadoPago] = useState('PENDIENTE');
  const [items, setItems] = useState([]);

  // Current item being added to form
  const [selectedProdId, setSelectedProdId] = useState('');
  const [cantItem, setCantItem] = useState(1);
  const [costoItem, setCostoItem] = useState('');
  const [loteCode, setLoteCode] = useState('');
  const [vencimientoItem, setVencimientoItem] = useState('');

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchProductos();
  }, []);

  const fetchCompras = async () => {
    try {
      const res = await fetch('/api/compras');
      const data = await res.json();
      if (Array.isArray(data)) setCompras(data);
    } catch (err) {}
  };

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores');
      const data = await res.json();
      if (Array.isArray(data)) setProveedores(data);
    } catch (err) {}
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      if (Array.isArray(data)) setProductos(data);
    } catch (err) {}
  };

  const handleAddItem = () => {
    if (!selectedProdId || Number(cantItem) <= 0 || Number(costoItem) < 0) {
      showToast('Selecciona un producto y especifica cantidad y costo válidos', 'error');
      return;
    }

    const prod = productos.find(p => p.id === Number(selectedProdId));
    if (!prod) return;

    const newItem = {
      producto_id: prod.id,
      nombre: prod.nombre,
      codigo_barras: prod.codigo_barras,
      cantidad: Number(cantItem),
      precio_costo_unitario: Number(costoItem),
      codigo_lote: loteCode || `LOT-${Date.now().toString().slice(-5)}`,
      fecha_vencimiento: vencimientoItem || null
    };

    setItems([...items, newItem]);
    setSelectedProdId('');
    setCantItem(1);
    setCostoItem('');
    setLoteCode('');
    setVencimientoItem('');
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmitCompra = async (e) => {
    e.preventDefault();
    if (!proveedorId || items.length === 0) {
      showToast('Selecciona un proveedor y agrega al menos un producto a la compra', 'error');
      return;
    }

    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor_id: Number(proveedorId),
          numero_factura_proveedor: nroFactura,
          estado_pago: estadoPago,
          items
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar compra');

      showToast('Compra registrada exitosamente y stock de lotes incrementado', 'success');
      setShowModal(false);
      setProveedorId('');
      setNroFactura('');
      setItems([]);
      fetchCompras();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const totalCompraUsd = items.reduce((sum, item) => sum + (item.cantidad * item.precio_costo_unitario), 0);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Registro de Compras & Abasto</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Ingreso de facturas de proveedores con generación automática de Lotes FIFO y reabastecimiento de stock.
            </p>
          </div>

          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            Registrar Nueva Compra
          </button>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>ID / Factura N°</th>
                <th style={{ padding: '1rem' }}>Proveedor</th>
                <th style={{ padding: '1rem' }}>Fecha Compra</th>
                <th style={{ padding: '1rem' }}>Total ($ USD)</th>
                <th style={{ padding: '1rem' }}>Estado de Pago</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                    Factura #{c.numero_factura_proveedor || c.id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                    {c.proveedor_nombre}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                    {new Date(c.fecha_compra).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#059669' }}>
                    ${Number(c.monto_total_usd).toFixed(2)} USD
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${c.estado_pago === 'PAGADO' ? 'badge-success' : 'badge-warning'}`}>
                      {c.estado_pago}
                    </span>
                  </td>
                </tr>
              ))}
              {compras.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay facturas de compra registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', background: '#ffffff', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0f172a' }}>Registrar Nueva Factura de Compra</h2>

            <form onSubmit={handleSubmitCompra} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Proveedor *</label>
                  <select 
                    required 
                    value={proveedorId} 
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Selecciona Proveedor...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.razon_social} ({p.rif_identificacion})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>N° Factura Proveedor</label>
                  <input 
                    type="text" 
                    value={nroFactura} 
                    onChange={(e) => setNroFactura(e.target.value)} 
                    placeholder="Ej. FACT-90412" 
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Estado de Pago *</label>
                  <select 
                    value={estadoPago} 
                    onChange={(e) => setEstadoPago(e.target.value)}
                    className="input-field"
                  >
                    <option value="PENDIENTE">PENDIENTE (Cuenta por Pagar)</option>
                    <option value="PAGADO">PAGADO (De Contado)</option>
                  </select>
                </div>
              </div>

              {/* Add Product Line Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.75rem' }}>
                  Agregar Producto a la Compra
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Producto</label>
                    <select 
                      value={selectedProdId} 
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        const prod = productos.find(p => p.id === Number(e.target.value));
                        if (prod) setCostoItem(prod.precio_costo || '');
                      }}
                      className="input-field"
                      style={{ fontSize: '0.82rem' }}
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock_actual})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Cantidad</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={cantItem} 
                      onChange={(e) => setCantItem(e.target.value)} 
                      className="input-field" 
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Costo U. ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={costoItem} 
                      onChange={(e) => setCostoItem(e.target.value)} 
                      placeholder="0.00" 
                      className="input-field" 
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Código Lote</label>
                    <input 
                      type="text" 
                      value={loteCode} 
                      onChange={(e) => setLoteCode(e.target.value)} 
                      placeholder="Ej. L-001" 
                      className="input-field" 
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Vencimiento</label>
                    <input 
                      type="date" 
                      value={vencimientoItem} 
                      onChange={(e) => setVencimientoItem(e.target.value)} 
                      className="input-field" 
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  <button type="button" onClick={handleAddItem} className="btn btn-primary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}>
                    + Añadir
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div style={{ border: '1px solid #dbeafe', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#eff6ff', color: '#1e40af' }}>
                      <th style={{ padding: '0.65rem' }}>Producto</th>
                      <th style={{ padding: '0.65rem' }}>Cant.</th>
                      <th style={{ padding: '0.65rem' }}>Costo U.</th>
                      <th style={{ padding: '0.65rem' }}>Lote</th>
                      <th style={{ padding: '0.65rem' }}>Vencimiento</th>
                      <th style={{ padding: '0.65rem' }}>Subtotal</th>
                      <th style={{ padding: '0.65rem', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eff6ff' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 600, color: '#0f172a' }}>{it.nombre}</td>
                        <td style={{ padding: '0.65rem' }}>{it.cantidad} unids</td>
                        <td style={{ padding: '0.65rem' }}>${it.precio_costo_unitario.toFixed(2)}</td>
                        <td style={{ padding: '0.65rem', fontFamily: 'monospace', color: '#2563eb' }}>{it.codigo_lote}</td>
                        <td style={{ padding: '0.65rem' }}>{it.fecha_vencimiento || 'N/A'}</td>
                        <td style={{ padding: '0.65rem', fontWeight: 700, color: '#059669' }}>${(it.cantidad * it.precio_costo_unitario).toFixed(2)}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                          No has agregado productos a esta compra.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #dbeafe', paddingTop: '1rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                  Total Compra: ${totalCompraUsd.toFixed(2)} USD
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Finalizar Compra</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
