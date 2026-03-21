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

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rutas públicas
  const publicRoutes = ['/login']
  if (publicRoutes.includes(path)) {
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role === 'superadmin') return NextResponse.redirect(new URL('/superadmin', request.url))
      else if (userData?.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      else if (userData?.role === 'cobrador') return NextResponse.redirect(new URL('/cobrador', request.url))
    }
    return supabaseResponse
  }

  // Sin sesión → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Obtener datos del usuario
  const { data: userData } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  // Cuenta bloqueada
  if (userData?.status === 'blocked') {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      new URL('/login?error=cuenta_bloqueada', request.url)
    )
  }

  // =============================================
  // VERIFICACIONES PARA ADMIN
  // =============================================
  if (userData?.role === 'admin' && path.startsWith('/admin')) {
    const { data: tenantData } = await supabase
      .from('users')
      .select('tenant:tenants(status, name)')
      .eq('id', user.id)
      .single()

    const tenant = (tenantData?.tenant as any)

    if (tenant?.status === 'frozen') {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(`/login?error=oficina_congelada&oficina=${encodeURIComponent(tenant.name)}`, request.url)
      )
    }

    if (tenant?.status === 'inactive') {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(`/login?error=oficina_inactiva&oficina=${encodeURIComponent(tenant.name)}`, request.url)
      )
    }
  }

  // =============================================
  // VERIFICACIONES PARA COBRADOR
  // =============================================
  if (userData?.role === 'cobrador' && path.startsWith('/cobrador')) {
    const { data: routeData } = await supabase
      .from('routes')
      .select('status, name, tenant:tenants(status, name)')
      .eq('cobrador_id', user.id)
      .single()

    const tenant = (routeData?.tenant as any)
    const routeStatus = routeData?.status
    const routeName = routeData?.name ?? 'tu ruta'
    const tenantName = tenant?.name ?? 'tu oficina'

    // Ruta desactivada
    if (routeStatus === 'inactive') {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(`/login?error=ruta_inactiva&ruta=${encodeURIComponent(routeName)}`, request.url)
      )
    }

    // Ruta eliminada (soft delete)
    if (!routeData) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/login?error=ruta_no_encontrada', request.url)
      )
    }

    // Oficina congelada
    if (tenant?.status === 'frozen') {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(`/login?error=oficina_congelada&oficina=${encodeURIComponent(tenantName)}`, request.url)
      )
    }

    // Oficina inactiva
    if (tenant?.status === 'inactive') {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(`/login?error=oficina_inactiva&oficina=${encodeURIComponent(tenantName)}`, request.url)
      )
    }
  }

  // =============================================
  // PROTEGER RUTAS POR ROL
  // =============================================
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
