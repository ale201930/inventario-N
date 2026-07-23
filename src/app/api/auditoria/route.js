import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const fecha = searchParams.get('fecha') || '';

    let sql = `
      SELECT a.*, 
             p.nombre as producto_nombre, 
             p.codigo_barras, 
             p.imagen_url as producto_imagen,
             u.nombre as usuario_nombre,
             u.rol as usuario_rol
      FROM auditoria_movimientos a
      LEFT JOIN productos p ON a.producto_id = p.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      sql += ` AND a.tipo_movimiento = ?`;
      params.push(tipo);
    }

    if (fecha) {
      sql += ` AND DATE(a.fecha_movimiento) = ?`;
      params.push(fecha);
    }

    sql += ` ORDER BY a.fecha_movimiento DESC`;

    const logs = await query(sql, params);
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Error al consultar auditoría:', err);
    return NextResponse.json({ error: 'Error al consultar bitácora de auditoría' }, { status: 500 });
  }
}
