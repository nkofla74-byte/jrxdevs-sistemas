import { NextRequest, NextResponse } from 'next/server'
import { getCobradorLocation } from '@/modules/cobrador/location-actions'

export async function GET(req: NextRequest) {
  const routeId = req.nextUrl.searchParams.get('routeId')
  if (!routeId) {
    return NextResponse.json({ error: 'routeId requerido' }, { status: 400 })
  }
  const result = await getCobradorLocation(routeId)
  return NextResponse.json(result)
}
