import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const lotes = await query(`
      SELECT l.*, p.nombre as producto_nombre, p.codigo_barras as producto_codigo, pr.razon_social as proveedor_nombre
      FROM compras_detalle_lotes l
      LEFT JOIN productos p ON l.producto_id = p.id
      LEFT JOIN compras c ON l.compra_id = c.id
      LEFT JOIN proveedores pr ON c.proveedor_id = pr.id
      ORDER BY l.fecha_creacion DESC
    `);
    return NextResponse.json(lotes);
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar lotes' }, { status: 500 });
  }
}
