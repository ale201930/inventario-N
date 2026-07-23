import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const prods = await query('SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?', [id]);
    if (!prods || prods.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(prods[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';

    let codigo_barras, nombre, descripcion, categoria_id, precio_costo, precio_venta, stock_minimo, imagen_url;

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      codigo_barras = formData.get('codigo_barras');
      nombre = formData.get('nombre');
      descripcion = formData.get('descripcion') || '';
      categoria_id = formData.get('categoria_id') ? Number(formData.get('categoria_id')) : null;
      precio_costo = parseFloat(formData.get('precio_costo') || 0);
      precio_venta = parseFloat(formData.get('precio_venta') || 0);
      stock_minimo = parseInt(formData.get('stock_minimo') || 5, 10);
      imagen_url = formData.get('imagen_existente') || formData.get('imagen_url') || null;

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
      stock_minimo = parseInt(body.stock_minimo || 5, 10);
      imagen_url = body.imagen_url !== undefined ? body.imagen_url : null;
    }

    await query(
      `UPDATE productos 
       SET codigo_barras = ?, nombre = ?, descripcion = ?, categoria_id = ?, imagen_url = COALESCE(?, imagen_url), precio_costo = ?, precio_venta = ?, stock_minimo = ?
       WHERE id = ?`,
      [codigo_barras, nombre, descripcion, categoria_id, imagen_url, precio_costo, precio_venta, stock_minimo, Number(id)]
    );

    return NextResponse.json({ success: true, imagen_url });
  } catch (err) {
    console.error('Error actualizando producto:', err);
    return NextResponse.json({ error: 'Error al actualizar producto: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const prodId = Number(id);
    await query('DELETE FROM auditoria_movimientos WHERE producto_id = ?', [prodId]);
    await query('DELETE FROM detalle_ventas WHERE producto_id = ?', [prodId]);
    await query('DELETE FROM productos WHERE id = ?', [prodId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return NextResponse.json({ error: 'Error al eliminar producto: ' + err.message }, { status: 500 });
  }
}
