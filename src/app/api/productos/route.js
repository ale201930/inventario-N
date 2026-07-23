import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const categoria = searchParams.get('categoria') || '';
    const stockStatus = searchParams.get('stock') || '';

    let sql = `
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR p.descripcion LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (categoria) {
      sql += ` AND p.categoria_id = ?`;
      params.push(categoria);
    }

    if (stockStatus === 'critico') {
      sql += ` AND p.stock_actual <= p.stock_minimo`;
    } else if (stockStatus === 'disponible') {
      sql += ` AND p.stock_actual > 0`;
    }

    sql += ` ORDER BY p.nombre ASC`;

    const products = await query(sql, params);
    return NextResponse.json(products);
  } catch (err) {
    console.error('Error al listar productos:', err);
    return NextResponse.json({ error: 'Error al consultar productos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let codigo_barras, nombre, descripcion, categoria_id, precio_costo, precio_venta, stock_actual, stock_minimo, imagen_url;

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      codigo_barras = formData.get('codigo_barras');
      nombre = formData.get('nombre');
      descripcion = formData.get('descripcion') || '';
      categoria_id = formData.get('categoria_id') ? Number(formData.get('categoria_id')) : null;
      precio_costo = parseFloat(formData.get('precio_costo') || 0);
      precio_venta = parseFloat(formData.get('precio_venta') || 0);
      stock_actual = parseInt(formData.get('stock_actual') || 0, 10);
      stock_minimo = parseInt(formData.get('stock_minimo') || 5, 10);
      imagen_url = formData.get('imagen_url') || null;

      const file = formData.get('imagen') || formData.get('file');
      if (file && typeof file === 'object' && file.name && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        const ext = path.extname(file.name) || '.jpg';
        const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
        await writeFile(path.join(uploadsDir, filename), buffer);
        imagen_url = `/uploads/${filename}`;
      }
    } else {
      const body = await request.json();
      codigo_barras = body.codigo_barras;
      nombre = body.nombre;
      descripcion = body.descripcion || '';
      categoria_id = body.categoria_id ? Number(body.categoria_id) : null;
      precio_costo = parseFloat(body.precio_costo || 0);
      precio_venta = parseFloat(body.precio_venta || 0);
      stock_actual = parseInt(body.stock_actual || 0, 10);
      stock_minimo = parseInt(body.stock_minimo || 5, 10);
      imagen_url = body.imagen_url || null;
    }

    if (!codigo_barras || !nombre) {
      return NextResponse.json({ error: 'Código de barras y nombre son obligatorios' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO productos 
      (codigo_barras, nombre, descripcion, categoria_id, imagen_url, precio_costo, precio_venta, stock_actual, stock_minimo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo_barras, nombre, descripcion, categoria_id, imagen_url, precio_costo, precio_venta, stock_actual, stock_minimo]
    );

    if (stock_actual > 0) {
      await query(
        `INSERT INTO auditoria_movimientos (producto_id, usuario_id, tipo_movimiento, cantidad, justificacion) 
        VALUES (?, ?, 'ENTRADA', ?, 'Inventario inicial de creación de producto')`,
        [res.insertId, 1, stock_actual]
      );
    }

    return NextResponse.json({ success: true, id: res.insertId, imagen_url });
  } catch (err) {
    console.error('Error al guardar producto:', err);
    return NextResponse.json({ error: 'Error al registrar el producto: ' + err.message }, { status: 500 });
  }
}
