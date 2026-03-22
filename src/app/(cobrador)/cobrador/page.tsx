import { getCobradorDashboard } from '@/modules/cobrador/actions'
import { redirect } from 'next/navigation'
import CobradorDashboard from '@/components/cobrador/CobradorDashboard'
import GpsGuard from '@/components/cobrador/GpsGuard'

export default async function CobradorPage() {
  const { data, error } = await getCobradorDashboard()

  if (error || !data) redirect('/login')

  return (
    <GpsGuard>
      <CobradorDashboard data={data} />
    </GpsGuard>
  )
}
