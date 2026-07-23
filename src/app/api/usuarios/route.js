import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const users = await query('SELECT * FROM usuarios ORDER BY nombre ASC');
    const parsedUsers = (users || []).map(u => {
      let permisosArr = [];
      if (u.permisos) {
        try {
          permisosArr = typeof u.permisos === 'string' ? JSON.parse(u.permisos) : (u.permisos || []);
        } catch (e) {
          permisosArr = [];
        }
      } else {
        permisosArr = u.rol === 'ADMIN'
          ? ['inicio', 'perfil', 'proveedores', 'compras', 'lotes', 'pos', 'inventario', 'creditos', 'productos', 'pagos_proveedores', 'reportes', 'auditoria', 'usuarios']
          : ['inicio', 'perfil', 'pos', 'inventario', 'creditos'];
      }
      return { ...u, permisos: permisosArr };
    });
    return NextResponse.json(parsedUsers);
  } catch (err) {
    console.error('Error en GET /api/usuarios:', err);
    return NextResponse.json({ error: 'Error al consultar usuarios: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre, email, password, rol, permisos } = await request.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const password_hash = await hashPassword(password);
    const userRole = rol === 'ADMIN' ? 'ADMIN' : 'TRABAJADOR';

    const defaultPermisos = userRole === 'ADMIN' 
      ? ['inicio', 'perfil', 'proveedores', 'compras', 'lotes', 'pos', 'inventario', 'creditos', 'productos', 'pagos_proveedores', 'reportes', 'auditoria', 'usuarios']
      : ['inicio', 'perfil', 'pos', 'inventario', 'creditos'];

    const finalPermisos = Array.isArray(permisos) ? JSON.stringify(permisos) : JSON.stringify(defaultPermisos);

    const res = await query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, permisos, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre, email, password_hash, userRole, finalPermisos]
    );

    return NextResponse.json({ success: true, id: res.insertId });
  } catch (err) {
    console.error('Error creando usuario:', err);
    return NextResponse.json({ error: 'Error al registrar el usuario: ' + err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, nombre, email, password, rol, permisos, activo } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    if (nombre) {
      await query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, id]);
    }
    if (email) {
      await query('UPDATE usuarios SET email = ? WHERE id = ?', [email, id]);
    }
    if (rol !== undefined) {
      await query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id]);
    }
    if (permisos !== undefined) {
      const permisosStr = Array.isArray(permisos) ? JSON.stringify(permisos) : JSON.stringify(permisos || []);
      await query('UPDATE usuarios SET permisos = ? WHERE id = ?', [permisosStr, id]);
    }
    if (activo !== undefined) {
      await query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    }
    if (password && password.trim() !== '') {
      const password_hash = await hashPassword(password);
      await query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [password_hash, id]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar usuario: ' + err.message }, { status: 500 });
  }
}
