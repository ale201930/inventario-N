import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const ventas = await query(
      `SELECT v.*, u.nombre as usuario_nombre, c.nombre as cliente_nombre 
       FROM ventas v 
       LEFT JOIN usuarios u ON v.usuario_id = u.id 
       LEFT JOIN clientes c ON v.cliente_id = c.id
       ORDER BY v.fecha_venta DESC`
    );
    return NextResponse.json(ventas);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener historial de ventas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    const usuario_id = user ? user.id : 2;

    const body = await request.json();
    const rawItems = body.items || body.detalles || [];
    const metodo_pago = body.metodo_pago || 'EFECTIVO';
    const cliente_id = body.cliente_id ? Number(body.cliente_id) : null;

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'El carrito no contiene productos' }, { status: 400 });
    }

    if (metodo_pago === 'CREDITO' && !cliente_id) {
      return NextResponse.json({ error: 'Debes seleccionar o registrar un cliente para ventas a crédito' }, { status: 400 });
    }

    const validPaymentMethods = ['EFECTIVO', 'EFECTIVO_BS', 'PAGO_MOVIL', 'TRANSFERENCIA', 'PUNTO_VENTA', 'CREDITO'];
    const finalMetodoPago = validPaymentMethods.includes(metodo_pago) ? metodo_pago : 'EFECTIVO';

    let calculatedTotal = 0;
    const itemsToProcess = [];

    for (const item of rawItems) {
      const prod_id = Number(item.producto_id || item.id);
      const cant = Number(item.cantidad || 1);
      
      let precio_u = Number(item.precio_unitario || item.precio_venta || item.precio_unitario_usd || 0);

      // Fallback: If price is missing or zero, fetch catalog selling price
      if (precio_u <= 0) {
        const pRows = await query('SELECT precio_venta FROM productos WHERE id = ?', [prod_id]);
        if (Array.isArray(pRows) && pRows.length > 0) {
          precio_u = Number(pRows[0].precio_venta || 0);
        }
      }

      const subtotal = item.subtotal ? Number(item.subtotal) : (cant * precio_u);
      calculatedTotal += subtotal;

      itemsToProcess.push({
        producto_id: prod_id,
        cantidad: cant,
        precio_unitario: precio_u,
        subtotal
      });
    }

    const finalTotal = body.total !== undefined && parseFloat(body.total) > 0 
      ? parseFloat(body.total) 
      : calculatedTotal;

    // 1. Insert header into ventas
    const resVenta = await query(
      'INSERT INTO ventas (usuario_id, cliente_id, total, metodo_pago) VALUES (?, ?, ?, ?)',
      [usuario_id, cliente_id, finalTotal, finalMetodoPago]
    );

    const venta_id = resVenta.insertId || Date.now();

    // If sale is on Credit, create Credit record
    if (finalMetodoPago === 'CREDITO' && cliente_id) {
      await query(
        `INSERT INTO creditos_venta (venta_id, cliente_id, monto_total, monto_pendiente, estado)
         VALUES (?, ?, ?, ?, 'ACTIVO')`,
        [venta_id, cliente_id, finalTotal, finalTotal]
      );
    }

    // 2. Process details, consume stock FIFO by lots and update stock
    for (const item of itemsToProcess) {
      // FIFO Lot consumption logic
      let remainingQtyToDeduct = item.cantidad;
      const lotesDisponibles = await query(
        `SELECT * FROM compras_detalle_lotes 
         WHERE producto_id = ? AND cantidad_disponible > 0 
         ORDER BY fecha_creacion ASC`,
        [item.producto_id]
      );

      let assignedLoteId = null;

      if (Array.isArray(lotesDisponibles) && lotesDisponibles.length > 0) {
        for (const lote of lotesDisponibles) {
          if (remainingQtyToDeduct <= 0) break;
          assignedLoteId = lote.id;
          const toDeduct = Math.min(remainingQtyToDeduct, lote.cantidad_disponible);
          await query(
            `UPDATE compras_detalle_lotes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?`,
            [toDeduct, lote.id]
          );
          remainingQtyToDeduct -= toDeduct;
        }
      }

      await query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [venta_id, item.producto_id, assignedLoteId, item.cantidad, item.precio_unitario, item.subtotal]
      );

      await query(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );

      await query(
        `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion) 
         VALUES (?, ?, 'SALIDA', ?, ?)`,
        [item.producto_id, usuario_id, item.cantidad, `Venta Ticket #${venta_id} (${finalMetodoPago})`]
      );
    }

    return NextResponse.json({
      success: true,
      venta_id,
      fecha: new Date().toISOString(),
      metodo_pago: finalMetodoPago,
      total: finalTotal
    });
  } catch (err) {
    console.error('Error al procesar la venta:', err);
    return NextResponse.json({ error: 'Error al registrar la venta: ' + err.message }, { status: 500 });
  }
}
