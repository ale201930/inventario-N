import { jsPDF } from 'jspdf';

export function generatePdfTicket(saleData, cart) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 180] // Standard 80mm thermal receipt format
  });

  const tasaBcv = Number(saleData.bcvRate || 737.23);
  const totalUsd = Number(saleData.total || 0);
  const totalBs = saleData.totalBs || (totalUsd * tasaBcv);
  const cliente = saleData.cliente || null;

  let y = 8;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SISTEMA DE INVENTARIO', 40, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprobante Digital de Venta', 40, y, { align: 'center' });

  y += 4;
  doc.text(`Ticket #${saleData.venta_id || 'LOCAL'}`, 40, y, { align: 'center' });

  y += 4;
  doc.text(`Fecha: ${new Date(saleData.fecha || Date.now()).toLocaleString('es-VE')}`, 40, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Tasa BCV: Bs. ${tasaBcv.toFixed(2)} / $`, 40, y, { align: 'center' });

  y += 3;
  doc.setLineWidth(0.3);
  doc.line(4, y, 76, y);

  // Customer Section
  if (cliente) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DATOS DEL COMPRADOR:', 4, y);

    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${cliente.nombre || 'N/A'}`, 4, y);

    y += 3.5;
    doc.text(`Cédula/RIF: ${cliente.cedula_rif || 'N/A'}`, 4, y);

    if (cliente.telefono) {
      y += 3.5;
      doc.text(`Teléfono: ${cliente.telefono}`, 4, y);
    }
    if (cliente.direccion) {
      y += 3.5;
      doc.text(`Dirección: ${cliente.direccion}`, 4, y);
    }

    y += 2.5;
    doc.line(4, y, 76, y);
  }

  // Items Table Header
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Cant', 4, y);
  doc.text('Producto', 14, y);
  doc.text('P.U ($)', 54, y, { align: 'right' });
  doc.text('Subt ($)', 76, y, { align: 'right' });

  y += 2;
  doc.line(4, y, 76, y);

  // Items List
  doc.setFont('helvetica', 'normal');
  cart.forEach(item => {
    y += 4;
    const pu = Number(item.precio_venta || 0);
    const cant = Number(item.cantidad || 0);
    const subt = pu * cant;

    doc.text(`${cant}x`, 4, y);
    
    // Truncate long product names
    let prodName = item.nombre || 'Producto';
    if (prodName.length > 20) prodName = prodName.substring(0, 18) + '..';
    doc.text(prodName, 14, y);

    doc.text(`$${pu.toFixed(2)}`, 54, y, { align: 'right' });
    doc.text(`$${subt.toFixed(2)}`, 76, y, { align: 'right' });
  });

  y += 3;
  doc.line(4, y, 76, y);

  // Totals Section
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL USD:', 4, y);
  doc.text(`$${totalUsd.toFixed(2)}`, 76, y, { align: 'right' });

  y += 4.5;
  doc.text('TOTAL BS (BCV):', 4, y);
  doc.text(`Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 76, y, { align: 'right' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Método de Pago:', 4, y);
  doc.text(String(saleData.metodo_pago || 'EFECTIVO'), 76, y, { align: 'right' });

  y += 4;
  doc.line(4, y, 76, y);

  // Footer
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });

  const filename = `Ticket_${saleData.venta_id || 'LOCAL'}_${Date.now()}.pdf`;

  return {
    doc,
    filename,
    download: () => doc.save(filename),
    toBlob: () => doc.output('blob'),
    toDataUri: () => doc.output('datauristring')
  };
}
