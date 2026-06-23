import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // On ne protège que les chemins commençant par /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Si on est déjà sur la page de login, on laisse passer
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // On vérifie le cookie de session Admin
    const adminSession = request.cookies.get('hms_admin_session');

    // S'il n'y a pas de session, on redirige vers /admin/login
    if (!adminSession || adminSession.value !== 'authenticated') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pour tout le reste, on laisse passer (ex: /tracker, /candidat/*)
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
