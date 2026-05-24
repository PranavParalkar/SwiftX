import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import KycWizard from '@/components/KycWizard'

/**
 * /onboarding/kyc — entry to the KYC wizard.
 *
 * All status routing happens **server-side** here so there's no client-side
 * fetch race that could ping-pong with the dashboard layout. The wizard
 * (client component) is rendered only when the user is actually in
 * `not_started` state. (The layout already kicked admins and verified users
 * elsewhere, so we don't need to repeat those checks.)
 */
export default async function KycEntryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, kyc_status')
    .eq('id', user.id)
    .single()

  if (profile?.kyc_status === 'pending')  redirect('/onboarding/kyc/pending')
  if (profile?.kyc_status === 'rejected') redirect('/onboarding/kyc/rejected')
  // 'verified' is already handled by the onboarding layout.

  return <KycWizard defaultName={profile?.full_name ?? ''} />
}
