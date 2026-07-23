import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rango = searchParams.get('rango') || 'todo'; // hoy, semana, mes, todo

    let dateConditionVentas = '';
    let dateConditionMov = '';

    if (rango === 'hoy') {
      dateConditionVentas = 'AND DATE(v.fecha_venta) = CURDATE()';
      dateConditionMov = 'AND DATE(fecha_movimiento) = CURDATE()';
    } else if (rango === 'semana') {
      dateConditionVentas = 'AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      dateConditionMov = 'AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (rango === 'mes') {
      dateConditionVentas = 'AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      dateConditionMov = 'AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // 1. Direct query of sales list to compute reliable totals
    const ventasList = await query(`SELECT * FROM ventas v WHERE 1=1 ${dateConditionVentas}`);
    
    let totalVentasBrutas = 0;
    let totalTransacciones = 0;

    if (Array.isArray(ventasList)) {
      totalTransacciones = ventasList.length;
      totalVentasBrutas = ventasList.reduce((sum, v) => sum + Number(v.total || 0), 0);
    }

    // 2. Ganancia Bruta Real
    const sqlGanancia = `
      SELECT 
        COALESCE(SUM((dv.precio_unitario - COALESCE(p.precio_costo, 0)) * dv.cantidad), 0) as ganancia_bruta_total
      FROM ventas v
      JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE 1=1 ${dateConditionVentas}
    `;
    const gananciaResult = await query(sqlGanancia);
    let gananciaBruta = 0;
    if (Array.isArray(gananciaResult) && gananciaResult.length > 0) {
      gananciaBruta = Number(gananciaResult[0]?.ganancia_bruta_total || 0);
    }

    // 3. Pérdidas por Mermas
    const sqlMermas = `
      SELECT 
        COALESCE(SUM(a.cantidad * COALESCE(p.precio_costo, 0)), 0) as total_perdidasmermas,
        COALESCE(SUM(a.cantidad), 0) as total_unidades_perdidas
      FROM auditoria_movimientos a
      LEFT JOIN productos p ON a.producto_id = p.id
      WHERE a.tipo_movimiento = 'PERDIDA' ${dateConditionMov}
    `;
    const mermasResult = await query(sqlMermas);
    let totalPerdidas = 0;
    let unidadesPerdidas = 0;
    if (Array.isArray(mermasResult) && mermasResult.length > 0) {
      totalPerdidas = Number(mermasResult[0]?.total_perdidasmermas || 0);
      unidadesPerdidas = Number(mermasResult[0]?.total_unidades_perdidas || 0);
    }

    // 4. Top Productos con mayor rotación
    const sqlTop = `
      SELECT 
        p.id, p.nombre, p.imagen_url, p.codigo_barras,
        COALESCE(SUM(dv.cantidad), 0) as total_vendido,
        COALESCE(SUM(dv.subtotal), 0) as ingresos_generados
      FROM productos p
      LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
      GROUP BY p.id, p.nombre, p.imagen_url, p.codigo_barras
      ORDER BY total_vendido DESC
      LIMIT 5
    `;
    const topRotacion = await query(sqlTop);

    // 5. Productos con menor rotación
    const sqlLow = `
      SELECT 
        p.id, p.nombre, p.imagen_url, p.codigo_barras, p.stock_actual,
        COALESCE(SUM(dv.cantidad), 0) as total_vendido
      FROM productos p
      LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id
      GROUP BY p.id, p.nombre, p.imagen_url, p.codigo_barras, p.stock_actual
      ORDER BY total_vendido ASC
      LIMIT 5
    `;
    const menorRotacion = await query(sqlLow);

    return NextResponse.json({
      resumen: {
        totalVentas: totalVentasBrutas,
        gananciaBruta: gananciaBruta,
        totalTransacciones: totalTransacciones,
        totalPerdidas: totalPerdidas,
        unidadesPerdidas: unidadesPerdidas,
      },
      topRotacion: Array.isArray(topRotacion) ? topRotacion : [],
      menorRotacion: Array.isArray(menorRotacion) ? menorRotacion : []
    });
  } catch (err) {
    console.error('Error en reportes:', err);
    return NextResponse.json({ error: 'Error generando reporte financiero' }, { status: 500 });
  }
}
