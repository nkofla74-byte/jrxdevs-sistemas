import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener sesión actual
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rutas públicas — no requieren sesión
  const publicRoutes = ['/login']
  if (publicRoutes.includes(path)) {
    // Si ya está logueado, redirigir según rol
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      } else if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (userData?.role === 'cobrador') {
        return NextResponse.redirect(new URL('/cobrador', request.url))
      }
    }
    return supabaseResponse
  }

  // Si no hay sesión, redirigir al login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar rol según la ruta
  const { data: userData } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  // Si cuenta está bloqueada, cerrar sesión
  if (userData?.status === 'blocked') {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteger rutas por rol
  if (path.startsWith('/superadmin') && userData?.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/admin') && userData?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/cobrador') && userData?.role !== 'cobrador') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}