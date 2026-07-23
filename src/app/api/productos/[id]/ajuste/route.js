import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { tipo_movimiento, cantidad, justificacion } = await request.json();

    const user = getUserFromRequest(request);
    const usuario_id = user ? user.id : 1;

    const cant = parseInt(cantidad, 10);
    if (!cant || cant <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor a 0' }, { status: 400 });
    }

    if (!tipo_movimiento || !['ENTRADA', 'PERDIDA'].includes(tipo_movimiento)) {
      return NextResponse.json({ error: 'Tipo de movimiento inválido (ENTRADA o PERDIDA)' }, { status: 400 });
    }

    if (tipo_movimiento === 'PERDIDA' && (!justificacion || justificacion.trim() === '')) {
      return NextResponse.json({ error: 'La justificación es obligatoria para el registro de mermas o pérdidas' }, { status: 400 });
    }

    // Check current product stock
    const prods = await query('SELECT stock_actual FROM productos WHERE id = ?', [id]);
    if (!prods || prods.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const stock_actual = prods[0].stock_actual;

    if (tipo_movimiento === 'PERDIDA' && stock_actual < cant) {
      return NextResponse.json({ error: `Stock insuficiente. Stock disponible: ${stock_actual}` }, { status: 400 });
    }

    if (tipo_movimiento === 'ENTRADA') {
      await query('UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?', [cant, id]);
    } else {
      await query('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [cant, id]);
    }

    await query(
      `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, usuario_id, tipo_movimiento, cant, justificacion || (tipo_movimiento === 'ENTRADA' ? 'Ingreso de nuevo stock' : 'Merma')]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error en ajuste de inventario:', err);
    return NextResponse.json({ error: 'Error al procesar el ajuste de inventario' }, { status: 500 });
  }
}
