import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const proveedores = await query('SELECT * FROM proveedores ORDER BY razon_social ASC');
    return NextResponse.json(proveedores);
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar proveedores' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rif_identificacion, razon_social, telefono, email, direccion } = body;

    if (!rif_identificacion || !razon_social) {
      return NextResponse.json({ error: 'RIF y Razón Social son obligatorios' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO proveedores (rif_identificacion, razon_social, telefono, email, direccion) 
       VALUES (?, ?, ?, ?, ?)`,
      [rif_identificacion, razon_social, telefono || '', email || '', direccion || '']
    );

    return NextResponse.json({ success: true, id: res.insertId });
  } catch (err) {
    return NextResponse.json({ error: 'Error al guardar proveedor: ' + err.message }, { status: 500 });
  }
}
