import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const compras = await query(`
      SELECT c.*, p.razon_social as proveedor_nombre, p.rif_identificacion as proveedor_rif
      FROM compras c
      LEFT JOIN proveedores p ON c.proveedor_id = p.id
      ORDER BY c.fecha_compra DESC
    `);
    return NextResponse.json(compras);
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar compras' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { proveedor_id, numero_factura_proveedor, tasa_bcv_momento, estado_pago, items } = body;

    if (!proveedor_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Proveedor y al menos un producto en la compra son obligatorios' }, { status: 400 });
    }

    const monto_total_usd = items.reduce((sum, item) => sum + (Number(item.precio_costo_unitario || 0) * Number(item.cantidad || 0)), 0);

    const resCompra = await query(
      `INSERT INTO compras (proveedor_id, numero_factura_proveedor, monto_total_usd, tasa_bcv_momento, estado_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [proveedor_id, numero_factura_proveedor || '', monto_total_usd, tasa_bcv_momento || 1, estado_pago || 'PENDIENTE']
    );

    const compraId = resCompra.insertId;

    for (const item of items) {
      const codigoLote = item.codigo_lote || `LOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const cant = Number(item.cantidad || 0);

      await query(
        `INSERT INTO compras_detalle_lotes 
         (compra_id, producto_id, codigo_lote, cantidad_ingresada, cantidad_disponible, precio_costo_unitario, fecha_vencimiento)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [compraId, item.producto_id, codigoLote, cant, cant, item.precio_costo_unitario || 0, item.fecha_vencimiento || null]
      );

      // Increment product stock
      await query(
        `UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?`,
        [cant, item.producto_id]
      );

      // Audit movement
      await query(
        `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion)
         VALUES (?, 1, 'ENTRADA', ?, ?)`,
        [item.producto_id, cant, `Compra Factura #${numero_factura_proveedor || compraId} - Lote ${codigoLote}`]
      );
    }

    return NextResponse.json({ success: true, compra_id: compraId });
  } catch (err) {
    console.error('Error al registrar compra:', err);
    return NextResponse.json({ error: 'Error al registrar la compra: ' + err.message }, { status: 500 });
  }
}
