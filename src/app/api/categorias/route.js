import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const categories = await query('SELECT * FROM categorias ORDER BY nombre ASC');
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: 'Error al consultar categorías' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre, descripcion } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: 'Nombre de categoría requerido' }, { status: 400 });
    }
    const res = await query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion || '']);
    return NextResponse.json({ id: res.insertId, nombre, descripcion });
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}
