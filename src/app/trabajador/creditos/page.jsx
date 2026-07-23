'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { showToast } from '@/components/CustomNotification';

export default function WorkerCreditosPage() {
  const [creditos, setCreditos] = useState([]);
  const [search, setSearch] = useState('');
  const [bcvRate, setBcvRate] = useState(737.88);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState(null);

  // Abono Form State
  const [montoAbonado, setMontoAbonado] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    fetchCreditos();
    fetchBcv();
  }, []);

  const fetchCreditos = async () => {
    try {
      const res = await fetch('/api/creditos');
      const data = await res.json();
      if (Array.isArray(data)) setCreditos(data);
    } catch (err) {}
  };

  const fetchBcv = async () => {
    try {
      const res = await fetch('/api/bcv');
      const data = await res.json();
      if (data && data.promedio) setBcvRate(data.promedio);
    } catch (err) {}
  };

  const handleOpenAbono = (cr) => {
    setSelectedCredito(cr);
    setMontoAbonado('');
    setMetodoPago('EFECTIVO');
    setObservaciones('');
    setShowAbonoModal(true);
  };

  const handleSubmitAbono = async (e) => {
    e.preventDefault();
    if (!selectedCredito || Number(montoAbonado) <= 0) {
      showToast('Ingresa un monto de abono válido mayor a 0', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/creditos/${selectedCredito.id}/abonos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_abonado: Number(montoAbonado),
          metodo_pago: metodoPago,
          tasa_bcv: bcvRate,
          observaciones
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el abono');

      showToast('Abono registrado exitosamente', 'success');
      setShowAbonoModal(false);
      fetchCreditos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = creditos.filter(cr => 
    (cr.cliente_nombre && cr.cliente_nombre.toLowerCase().includes(search.toLowerCase())) ||
    (cr.cliente_cedula && cr.cliente_cedula.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Créditos & Cuentas por Cobrar (CxC)</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Control de cuentas activas de clientes, historial de abonos en dólares/bolívares y estado de cuenta.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por cliente o cédula/RIF..." 
            className="input-field" 
            style={{ maxWidth: '380px' }}
          />

          <div style={{ marginLeft: 'auto', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '20px', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700 }}>
            Tasa BCV: Bs. {Number(bcvRate).toFixed(2)} / $
          </div>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af' }}>
                <th style={{ padding: '1rem' }}>Cliente</th>
                <th style={{ padding: '1rem' }}>Cédula / RIF</th>
                <th style={{ padding: '1rem' }}>Monto Total ($)</th>
                <th style={{ padding: '1rem' }}>Saldo Pendiente ($)</th>
                <th style={{ padding: '1rem' }}>Pendiente en Bs.</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cr => {
                const pendUsd = Number(cr.monto_pendiente || 0);
                const pendBs = pendUsd * bcvRate;
                const isCancelado = cr.estado === 'CANCELADO' || pendUsd <= 0;

                return (
                  <tr key={cr.id} style={{ borderBottom: '1px solid #eff6ff' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      {cr.cliente_nombre}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#2563eb' }}>
                      {cr.cliente_cedula}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#475569' }}>
                      ${Number(cr.monto_total).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: isCancelado ? '#059669' : '#e11d48' }}>
                      ${pendUsd.toFixed(2)} USD
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                      Bs. {pendBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isCancelado ? 'badge-success' : 'badge-danger'}`}>
                        {isCancelado ? 'CANCELADO' : 'EN DEUDA'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      {!isCancelado && (
                        <button onClick={() => handleOpenAbono(cr)} className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}>
                          Registrar Abono
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron créditos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {showAbonoModal && selectedCredito && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #dbeafe' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0f172a' }}>Registrar Abono de Cliente</h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Cliente: <strong style={{ color: '#0f172a' }}>{selectedCredito.cliente_nombre}</strong> ({selectedCredito.cliente_cedula})
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#475569' }}>Saldo Pendiente ($ USD):</span>
                <strong style={{ color: '#e11d48' }}>${Number(selectedCredito.monto_pendiente).toFixed(2)} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Equivalente en Bs (BCV):</span>
                <strong style={{ color: '#2563eb' }}>Bs. {(Number(selectedCredito.monto_pendiente) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitAbono} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Monto a Abonar ($ USD) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={selectedCredito.monto_pendiente}
                  required 
                  value={montoAbonado} 
                  onChange={(e) => setMontoAbonado(e.target.value)} 
                  placeholder="0.00" 
                  className="input-field"
                />
                {Number(montoAbonado) > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '4px', fontWeight: 700 }}>
                    Equivalente en Bolívares: Bs. {(Number(montoAbonado) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Método de Pago *</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="input-field"
                >
                  <option value="EFECTIVO">EFECTIVO ($ USD)</option>
                  <option value="EFECTIVO_BS">EFECTIVO (Bolívares)</option>
                  <option value="PAGO_MOVIL">PAGO MÓVIL (Bs.)</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA (Bs.)</option>
                  <option value="ZELLE">ZELLE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>Observaciones / Comprobante</label>
                <input 
                  type="text" 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  placeholder="Ej. Referencia N° 849102" 
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAbonoModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
