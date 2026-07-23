import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const pagos = await query(`
      SELECT p.*, c.numero_factura_proveedor, c.monto_total_usd, pr.razon_social as proveedor_nombre
      FROM pagos_proveedores p
      LEFT JOIN compras c ON p.compra_id = c.id
      LEFT JOIN proveedores pr ON c.proveedor_id = pr.id
      ORDER BY p.fecha_pago DESC
    `);
    return NextResponse.json(pagos);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener pagos a proveedores' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { compra_id, monto_pagado, metodo_pago, observaciones } = body;

    const numMonto = Number(monto_pagado || 0);
    if (!compra_id || numMonto <= 0) {
      return NextResponse.json({ error: 'Compra y monto pagado válido son obligatorios' }, { status: 400 });
    }

    await query(
      `INSERT INTO pagos_proveedores (compra_id, monto_pagado, metodo_pago, observaciones)
       VALUES (?, ?, ?, ?)`,
      [compra_id, numMonto, metodo_pago || 'EFECTIVO', observaciones || '']
    );

    // Update purchase payment status to PAGADO
    await query(`UPDATE compras SET estado_pago = 'PAGADO' WHERE id = ?`, [compra_id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al registrar pago a proveedor: ' + err.message }, { status: 500 });
  }
}
