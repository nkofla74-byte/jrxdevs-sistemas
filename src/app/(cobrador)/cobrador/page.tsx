import { getCobradorDashboard } from '@/modules/cobrador/actions'
import { redirect } from 'next/navigation'
import CobradorDashboard from '@/components/cobrador/CobradorDashboard'

export default async function CobradorPage() {
  const { data, error } = await getCobradorDashboard()

  if (error || !data) redirect('/login')

  return <CobradorDashboard data={data} />
}