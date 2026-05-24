import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // IMPORTANT: read via adminClient (service role) so RLS recursion on the
  // `profiles_select_own` policy can't return a stale/empty row and cause
  // the dashboard ↔ onboarding redirect loop.
  const { data: profile } = await adminClient
    .from('profiles')
    .select('rm_id, full_name, role, kyc_status')
    .eq('id', user.id)
    .single()

  // KYC gate — admins bypass; everyone else must be 'verified'.
  if (profile?.role !== 'admin') {
    if (profile?.kyc_status === 'pending')        redirect('/onboarding/kyc/pending')
    else if (profile?.kyc_status === 'rejected')  redirect('/onboarding/kyc/rejected')
    else if (profile?.kyc_status !== 'verified')  redirect('/onboarding/kyc')
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}
