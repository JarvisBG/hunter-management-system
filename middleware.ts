import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protection des routes /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }
    const adminSession = request.cookies.get('hms_admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protection des routes /candidat/*
  if (request.nextUrl.pathname.startsWith('/candidat/')) {
    const parts = request.nextUrl.pathname.split('/');
    const requestedId = parts[2]; // /candidat/123 -> parts: ["", "candidat", "123"]

    const candidateSession = request.cookies.get('hms_candidate_session');

    // Si pas de session, ou si la session ne correspond pas à l'ID demandé
    if (!candidateSession || candidateSession.value !== requestedId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Pour tout le reste, on laisse passer (ex: /tracker)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/candidat/:path*'],
};
