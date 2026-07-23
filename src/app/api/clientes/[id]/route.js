import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cedula_rif, nombre, telefono, email, direccion } = body;

    if (!cedula_rif || !nombre) {
      return NextResponse.json({ error: 'Cédula/RIF y Nombre son obligatorios' }, { status: 400 });
    }

    await query(
      `UPDATE clientes 
       SET cedula_rif = ?, nombre = ?, telefono = ?, email = ?, direccion = ?
       WHERE id = ?`,
      [cedula_rif.trim(), nombre.trim(), telefono || '', email || '', direccion || '', Number(id)]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar cliente: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await query('DELETE FROM clientes WHERE id = ?', [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar cliente: ' + err.message }, { status: 500 });
  }
}
