import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rif_identificacion, razon_social, telefono, email, direccion, estado } = body;

    await query(
      `UPDATE proveedores 
       SET rif_identificacion = ?, razon_social = ?, telefono = ?, email = ?, direccion = ?, estado = ?
       WHERE id = ?`,
      [rif_identificacion, razon_social, telefono || '', email || '', direccion || '', estado !== undefined ? estado : 1, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando proveedor: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await query('DELETE FROM proveedores WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
