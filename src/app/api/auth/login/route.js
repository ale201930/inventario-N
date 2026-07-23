import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Ingresa correo y contraseña' }, { status: 400 });
    }

    const users = await query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) AND activo = 1', [email.trim()]);
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado o cuenta inactiva' }, { status: 401 });
    }

    const user = users[0];
    const isValid = await verifyPassword(password.trim(), user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    let permisosArr = [];
    try {
      permisosArr = typeof user.permisos === 'string' ? JSON.parse(user.permisos) : (user.permisos || []);
    } catch (e) {
      permisosArr = [];
    }

    const payload = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      permisos: permisosArr
    };

    const token = signToken(payload);

    const response = NextResponse.json({ success: true, token, user: payload });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Error en API Login:', err);
    return NextResponse.json({ error: 'Error interno de autenticación' }, { status: 500 });
  }
}
