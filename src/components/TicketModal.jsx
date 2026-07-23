'use client';

import { useState } from 'react';
import { showToast, showConfirm } from '@/components/CustomNotification';
import { generatePdfTicket } from '@/lib/generatePdfTicket';

export default function TicketModal({ saleData, cart, onClose, onCancelSale }) {
  const [canceling, setCanceling] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  if (!saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const pdf = generatePdfTicket(saleData, cart);
      pdf.download();
      showToast('Factura PDF descargada con éxito', 'success');
    } catch (err) {
      showToast('Error generando PDF: ' + err.message, 'error');
    }
  };

  const handleAnular = () => {
    showConfirm({
      title: 'Anular / Cancelar esta Venta',
      message: '¿Estás seguro de anular esta transacción? El stock devuelto se reincorporará inmediatamente a la existencia en inventario.',
      onConfirm: async () => {
        setCanceling(true);
        try {
          if (saleData.venta_id && saleData.venta_id !== 'LOCAL') {
            const res = await fetch(`/api/ventas/${saleData.venta_id}`, { method: 'DELETE' });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Error anulando venta');
            }
          }
          showToast('Venta anulada correctamente. Stock devuelto al inventario.', 'success');
          if (onCancelSale) onCancelSale();
          else onClose();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        } finally {
          setCanceling(false);
        }
      }
    });
  };

  const tasaBcv = Number(saleData.bcvRate || 737.23);
  const totalUsd = Number(saleData.total || 0);
  const totalBs = saleData.totalBs || (totalUsd * tasaBcv);
  const cliente = saleData.cliente || null;

  const generateWhatsAppText = () => {
    let text = `🧾 *COMPROBANTE DE COMPRA - SISTEMA DE INVENTARIO*\n`;
    text += `-------------------------------------------\n`;
    text += `*Ticket #:* ${saleData.venta_id || 'LOCAL'}\n`;
    text += `*Fecha:* ${new Date(saleData.fecha || Date.now()).toLocaleString('es-VE')}\n`;

    if (cliente) {
      text += `\n👤 *DATOS DEL CLIENTE:*\n`;
      if (cliente.nombre) text += `• *Nombre:* ${cliente.nombre}\n`;
      if (cliente.cedula_rif) text += `• *Cédula/RIF:* ${cliente.cedula_rif}\n`;
      if (cliente.telefono) text += `• *Teléfono:* ${cliente.telefono}\n`;
      if (cliente.direccion) text += `• *Dirección:* ${cliente.direccion}\n`;
    }

    text += `\n📦 *DETALLE DE COMPRA:*\n`;
    cart.forEach(item => {
      const pu = Number(item.precio_venta || 0);
      const cant = Number(item.cantidad || 0);
      const subt = pu * cant;
      text += `• ${cant}x ${item.nombre} -> $${subt.toFixed(2)} (Bs. ${(subt * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
    });

    text += `-------------------------------------------\n`;
    text += `💵 *TOTAL USD:* $${totalUsd.toFixed(2)}\n`;
    text += `🇻🇪 *TOTAL BS (BCV):* Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    text += `📈 *Tasa BCV:* Bs. ${tasaBcv.toFixed(2)} / $\n`;
    text += `💳 *Método de Pago:* ${saleData.metodo_pago || 'EFECTIVO'}\n`;
    text += `-------------------------------------------\n`;
    text += `¡Gracias por su preferencia y compra! 🙏✨`;

    return text;
  };

  const handleProcessSendWhatsApp = async (targetPhone) => {
    const rawPhone = targetPhone || cliente?.telefono || customPhone;
    if (!rawPhone) {
      setShowPhonePrompt(true);
      return;
    }

    setSendingWa(true);
    try {
      const pdf = generatePdfTicket(saleData, cart);
      const pdfDataUri = pdf.toDataUri();
      const textMessage = generateWhatsAppText();

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: rawPhone,
          text: textMessage,
          pdfDataUri: pdfDataUri,
          cliente_nombre: cliente?.nombre || 'Cliente'
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error enviando WhatsApp');

      if (result.sentViaGateway) {
        showToast(`Factura enviada automáticamente en segundo plano a ${result.phone || rawPhone}`, 'success');
      } else if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
        showToast('Abriendo WhatsApp con el mensaje del ticket...', 'info');
      }
      setShowPhonePrompt(false);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSendingWa(false);
    }
  };

  const handleCopyTicket = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      showToast('Comprobante copiado al portapapeles', 'success');
    } catch (err) {
      showToast('Error al copiar comprobante', 'error');
    }
  };

  return (
    <div 
      className="printable-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '1.5rem', background: '#ffffff', border: '1px solid #dbeafe', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}
          title="Cerrar"
        >
          ✕
        </button>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.45rem 0.75rem', borderRadius: '20px', color: '#059669', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
          ✓ VENTA EMITIDA Y REGISTRADA CON ÉXITO
        </div>

        {/* Ticket Header printable */}
        <div id="printable-ticket" style={{ background: '#fff', color: '#000', padding: '1.5rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed #000', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>SISTEMA DE INVENTARIO</h2>
            <div>Comprobante de Venta</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Ticket #{saleData.venta_id || 'LOCAL'}</div>
            <div style={{ fontSize: '0.75rem' }}>Fecha: {new Date(saleData.fecha || Date.now()).toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '4px' }}>Tasa BCV: Bs. {tasaBcv.toFixed(2)}</div>
          </div>

          {/* Customer Details section */}
          {cliente && (
            <div style={{ marginBottom: '0.85rem', borderBottom: '1px dashed #000', paddingBottom: '0.65rem', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>DATOS DEL CLIENTE:</div>
              <div><b>Nombre:</b> {cliente.nombre}</div>
              <div><b>Cédula/RIF:</b> {cliente.cedula_rif}</div>
              {cliente.telefono && <div><b>Teléfono:</b> {cliente.telefono}</div>}
              {cliente.direccion && <div><b>Dirección:</b> {cliente.direccion}</div>}
            </div>
          )}

          <table style={{ width: '100%', marginBottom: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ paddingBottom: '4px' }}>Cant</th>
                <th style={{ paddingBottom: '4px' }}>Prod</th>
                <th style={{ paddingBottom: '4px', textAlign: 'right' }}>P.U ($)</th>
                <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Subt ($)</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => {
                const pu = Number(item.precio_venta || 0);
                const cant = Number(item.cantidad || 0);
                const subt = pu * cant;

                return (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0' }}>{cant}x</td>
                    <td style={{ padding: '4px 0', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>${pu.toFixed(2)}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>${subt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
              <span>TOTAL USD:</span>
              <span>${totalUsd.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
              <span>TOTAL BS (BCV):</span>
              <span>Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '4px' }}>
              <span>Método Pago:</span>
              <span>{saleData.metodo_pago}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
            ¡Gracias por su compra!
          </div>
        </div>

        {/* Action Buttons: Imprimir / WhatsApp / PDF / Copiar / Nueva Venta */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
              🖨️ Imprimir Ticket
            </button>

            <button 
              onClick={() => handleProcessSendWhatsApp()}
              disabled={sendingWa}
              className="btn btn-success"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff', padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {sendingWa ? 'Enviando...' : '📲 Enviar WhatsApp'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button onClick={handleDownloadPdf} className="btn btn-secondary" style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}>
              📄 Descargar Factura PDF
            </button>

            <button onClick={handleCopyTicket} className="btn btn-secondary" style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
              📋 Copiar Texto
            </button>
          </div>

          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Nueva Venta
          </button>

          <button onClick={handleAnular} disabled={canceling} className="btn" style={{ width: '100%', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2', fontSize: '0.78rem', padding: '0.45rem', fontWeight: 600 }}>
            {canceling ? 'Anulando...' : 'Anular / Cancelar esta Venta'}
          </button>
        </div>

      </div>

      {/* WhatsApp Custom Phone Modal Prompt */}
      {showPhonePrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '380px', width: '100%', padding: '1.25rem', background: '#ffffff', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.5rem' }}>📲 Número de WhatsApp</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Ingrese el número telefónico del cliente para enviar la factura digital por WhatsApp:
            </p>

            <input 
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="Ej. 0412-1234567"
              className="input-field"
              style={{ marginBottom: '1rem' }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowPhonePrompt(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleProcessSendWhatsApp(customPhone)} className="btn btn-success" style={{ flex: 1, fontSize: '0.85rem' }}>
                Enviar Factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
