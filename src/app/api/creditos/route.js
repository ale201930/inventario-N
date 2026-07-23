import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const creditos = await query(`
      SELECT cr.*, cl.nombre as cliente_nombre, cl.cedula_rif as cliente_cedula, cl.telefono as cliente_telefono
      FROM creditos_venta cr
      LEFT JOIN clientes cl ON cr.cliente_id = cl.id
      ORDER BY cr.fecha_creacion DESC
    `);
    return NextResponse.json(creditos);
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar créditos' }, { status: 500 });
  }
}
