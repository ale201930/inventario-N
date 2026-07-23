import { NextResponse } from 'next/server';
import { query, resetMemoryStore } from '@/lib/db';

export async function POST() {
  try {
    // 1. Clean MySQL tables (preserving usuarios, categorias, productos, proveedores if any)
    try { await query('DELETE FROM abonos_credito'); } catch (e) {}
    try { await query('DELETE FROM creditos_venta'); } catch (e) {}
    try { await query('DELETE FROM detalle_ventas'); } catch (e) {}
    try { await query('DELETE FROM ventas'); } catch (e) {}
    try { await query('DELETE FROM auditoria_movimientos'); } catch (e) {}
    try { await query('DELETE FROM pagos_proveedores'); } catch (e) {}
    try { await query('DELETE FROM compras_detalle_lotes'); } catch (e) {}
    try { await query('DELETE FROM compras'); } catch (e) {}

    // 2. Reset memory store
    if (resetMemoryStore) {
      resetMemoryStore();
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Sistema limpiado exitosamente. Todas las ventas, créditos y transacciones han sido reiniciadas a cero, conservando únicamente los usuarios.' 
    });
  } catch (err) {
    return NextResponse.json({ error: 'Error al limpiar sistema: ' + err.message }, { status: 500 });
  }
}
