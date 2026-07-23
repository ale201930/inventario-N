import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const creditoId = Number(id);
    const body = await request.json();
    const { monto_abonado, metodo_pago, tasa_bcv, observaciones } = body;

    const numMonto = Number(monto_abonado || 0);
    if (numMonto <= 0) {
      return NextResponse.json({ error: 'El monto a abonar debe ser mayor a 0' }, { status: 400 });
    }

    // 1. Register abono
    await query(
      `INSERT INTO abonos_credito (credito_id, monto_abonado, metodo_pago, tasa_bcv, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [creditoId, numMonto, metodo_pago || 'EFECTIVO', tasa_bcv || 1, observaciones || '']
    );

    // 2. Fetch current credit to update remaining balance
    const creditos = await query('SELECT * FROM creditos_venta WHERE id = ?', [creditoId]);
    if (creditos && creditos.length > 0) {
      const actual = creditos[0];
      const nuevoPendiente = Math.max(0, Number(actual.monto_pendiente) - numMonto);
      await query(
        `UPDATE creditos_venta SET monto_pendiente = ? WHERE id = ?`,
        [nuevoPendiente, creditoId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al abonar a crédito:', err);
    return NextResponse.json({ error: 'Error al registrar abono: ' + err.message }, { status: 500 });
  }
}
