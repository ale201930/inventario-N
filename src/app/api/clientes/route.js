import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('cedula') || '';

    if (q) {
      const cleanDigits = q.replace(/\D/g, '');
      const searchPattern = `%${q.trim()}%`;
      const digitsPattern = cleanDigits ? `%${cleanDigits}%` : searchPattern;

      const clientes = await query(
        `SELECT * FROM clientes 
         WHERE cedula_rif LIKE ? 
            OR nombre LIKE ? 
            OR (LENGTH(?) >= 5 AND REPLACE(REPLACE(REPLACE(cedula_rif, 'V-', ''), 'E-', ''), 'J-', '') LIKE ?)
         ORDER BY nombre ASC`,
        [searchPattern, searchPattern, cleanDigits, digitsPattern]
      );
      return NextResponse.json(clientes);
    }

    const clientes = await query('SELECT * FROM clientes ORDER BY nombre ASC');
    return NextResponse.json(clientes);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cedula_rif, nombre, telefono, email, direccion } = body;

    if (!cedula_rif || !nombre) {
      return NextResponse.json({ error: 'Cédula/RIF y Nombre son obligatorios' }, { status: 400 });
    }

    const cleanCedula = cedula_rif.trim();
    const cleanDigits = cleanCedula.replace(/\D/g, '');

    // Check if client already exists in DB by exact cedula_rif or digits match
    const existing = await query(
      `SELECT * FROM clientes 
       WHERE LOWER(cedula_rif) = LOWER(?) 
          OR (LENGTH(?) >= 5 AND REPLACE(REPLACE(REPLACE(cedula_rif, 'V-', ''), 'E-', ''), 'J-', '') = ?)`,
      [cleanCedula, cleanDigits, cleanDigits]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        id: existing[0].id, 
        cliente: existing[0],
        alreadyExisted: true 
      });
    }

    const res = await query(
      `INSERT INTO clientes (cedula_rif, nombre, telefono, email, direccion)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanCedula, nombre.trim(), telefono ? telefono.trim() : '', email ? email.trim() : '', direccion ? direccion.trim() : '']
    );

    const newId = res.insertId;
    const created = {
      id: newId,
      cedula_rif: cleanCedula,
      nombre: nombre.trim(),
      telefono: telefono ? telefono.trim() : '',
      direccion: direccion ? direccion.trim() : ''
    };

    return NextResponse.json({ success: true, id: newId, cliente: created });
  } catch (err) {
    return NextResponse.json({ error: 'Error al registrar cliente: ' + err.message }, { status: 500 });
  }
}
