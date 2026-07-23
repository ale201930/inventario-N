import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const venta_id = Number(id);

    // 1. Get details of the sale to restore product stock
    const detalles = await query('SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?', [venta_id]);

    for (const d of detalles) {
      // Restore stock
      await query('UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?', [d.cantidad, d.producto_id]);

      // Register audit movement for cancellation
      await query(
        `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion) 
         VALUES (?, 1, 'ENTRADA', ?, ?)`,
        [d.producto_id, d.cantidad, `Reversión/Anulación de Venta Ticket #${venta_id}`]
      );
    }

    // 2. Delete sale record and details
    await query('DELETE FROM detalle_ventas WHERE venta_id = ?', [venta_id]);
    await query('DELETE FROM ventas WHERE id = ?', [venta_id]);

    return NextResponse.json({ success: true, message: 'Venta anulada e inventario reincorporado correctamente' });
  } catch (err) {
    console.error('Error anulando venta:', err);
    return NextResponse.json({ error: 'Error al anular la venta: ' + err.message }, { status: 500 });
  }
}
