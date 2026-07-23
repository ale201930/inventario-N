import { NextResponse } from 'next/server';

function decodeToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Static files and API routes bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js')
  ) {
    return NextResponse.next();
  }

  const payload = decodeToken(token);

  // Public login page or root redirect
  if (pathname === '/login' || pathname === '/') {
    if (payload && payload.rol) {
      return NextResponse.redirect(new URL('/inicio', request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes check
  if (
    pathname.startsWith('/inicio') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/trabajador')
  ) {
    if (!payload || !payload.rol) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Strict RBAC: All /admin routes (productos, auditoria, reportes, usuarios) are ADMIN only!
    if (pathname.startsWith('/admin') && payload.rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/inicio', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
