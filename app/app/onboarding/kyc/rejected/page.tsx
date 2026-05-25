import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { AlertOctagon, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function KycRejectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('profiles').select('full_name, kyc_status').eq('id', user.id).single()

  if (profile?.kyc_status === 'verified')   redirect('/dashboard')
  if (profile?.kyc_status === 'pending')    redirect('/onboarding/kyc/pending')
  if (profile?.kyc_status === 'not_started') redirect('/onboarding/kyc')

  const { data: sub } = await adminClient
    .from('kyc_submissions')
    .select('rejection_reason, reviewed_at')
    .eq('user_id', user.id).maybeSingle()

  return (
    <div className="sx-fade-up">
      <div className="sx-card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full"
             style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)', opacity: 0.12 }} />

        <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center"
             style={{ background: 'rgba(244,63,94,0.12)', color: '#be123c' }}>
          <AlertOctagon size={30} />
        </div>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
          KYC needs your attention
        </h1>
        <p className="mt-2 text-base max-w-xl" style={{ color: 'var(--sx-ink-2)' }}>
          Our compliance reviewer wasn't able to approve your submission. Please fix the issue called out below and re-submit — it usually takes less than a minute.
        </p>

        {sub?.rejection_reason && (
          <div className="mt-6 rounded-2xl p-4"
               style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)' }}>
            <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: '#be123c' }}>Reviewer's note</p>
            <p className="mt-1 text-sm" style={{ color: '#9f1239' }}>{sub.rejection_reason}</p>
            {sub.reviewed_at && (
              <p className="mt-2 text-xs" style={{ color: 'var(--sx-ink-3)' }}>
                Reviewed {format(new Date(sub.reviewed_at), 'dd MMM yyyy, HH:mm')}
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link href="/onboarding/kyc" className="sx-btn sx-btn-primary">
            Re-submit my KYC <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--sx-ink-3)' }}>
        Questions? Contact <a className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="mailto:support@swiftx.app">support@swiftx.app</a>.
      </p>
    </div>
  )
}
