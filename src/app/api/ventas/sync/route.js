import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    const usuario_id = user ? user.id : 2;

    const { pendingSales } = await request.json();
    if (!pendingSales || !Array.isArray(pendingSales) || pendingSales.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    const syncedIds = [];

    for (const sale of pendingSales) {
      try {
        const resVenta = await query(
          'INSERT INTO ventas (usuario_id, total, metodo_pago) VALUES (?, ?, ?)',
          [usuario_id, parseFloat(sale.total), sale.metodo_pago]
        );
        const venta_id = resVenta.insertId || Date.now();

        for (const item of sale.items) {
          await query(
            'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
            [venta_id, Number(item.producto_id), Number(item.cantidad), Number(item.precio_unitario), Number(item.subtotal)]
          );

          await query(
            'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
            [Number(item.cantidad), Number(item.producto_id)]
          );

          await query(
            `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion) 
             VALUES (?, ?, 'SALIDA', ?, ?)`,
            [Number(item.producto_id), usuario_id, Number(item.cantidad), `Sincronización Venta Offline Ticket #${venta_id}`]
          );
        }

        syncedIds.push(sale.id);
      } catch (e) {
        console.error('Error sincronizando venta individual:', e);
      }
    }

    return NextResponse.json({ success: true, syncedIds });
  } catch (err) {
    return NextResponse.json({ error: 'Error durante la sincronización' }, { status: 500 });
  }
}
