import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function KycPendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('profiles').select('full_name, kyc_status').eq('id', user.id).single()

  // Route corrections
  if (profile?.kyc_status === 'verified') redirect('/dashboard')
  if (profile?.kyc_status === 'rejected') redirect('/onboarding/kyc/rejected')
  if (profile?.kyc_status === 'not_started' || !profile?.kyc_status) redirect('/onboarding/kyc')

  const { data: sub } = await adminClient
    .from('kyc_submissions').select('submitted_at, id_type, country')
    .eq('user_id', user.id).maybeSingle()

  return (
    <div className="sx-fade-up">
      <div className="sx-card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full"
             style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)', opacity: 0.10 }} />

        <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center"
             style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
          <Clock size={30} />
        </div>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
          KYC under review
        </h1>
        <p className="mt-2 text-base max-w-xl" style={{ color: 'var(--sx-ink-2)' }}>
          Thanks {profile?.full_name?.split(' ')[0]}, we've received your application.
          A SwiftX compliance reviewer will go through it shortly — typically within a few minutes during business hours.
        </p>

        {sub && (
          <div className="mt-6 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
               style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
            <Field label="Submitted" value={format(new Date(sub.submitted_at), 'dd MMM yyyy, HH:mm')} />
            <Field label="Primary ID type" value={String(sub.id_type).toUpperCase()} />
            <Field label="Country" value={String(sub.country)} />
          </div>
        )}

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Step icon={ShieldCheck} title="What happens now" body="Our reviewer checks the ID and address details you submitted against regulator-approved sources." />
          <Step icon={Mail}        title="You'll be notified" body="The moment your account is approved you'll be able to refresh and access the full dashboard." />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/onboarding/kyc/pending" className="sx-btn sx-btn-ghost text-sm">
            Check status again
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-sm font-semibold hover:underline" style={{ color: 'var(--sx-ink-3)' }}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--sx-ink-3)' }}>
        Stuck? Reach <a className="font-semibold" style={{ color: 'var(--sx-primary)' }} href="mailto:support@swiftx.app">support@swiftx.app</a> with your SwiftX ID.
      </p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ color: 'var(--sx-ink)' }}>{value}</p>
    </div>
  )
}

function Step({ icon: Icon, title, body }: any) {
  return (
    <div className="rounded-2xl p-4 flex gap-3"
         style={{ background: 'var(--sx-primary-soft)', border: '1px solid rgba(99,102,241,0.18)' }}>
      <span className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
        <Icon size={16} />
      </span>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--sx-ink)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sx-ink-3)' }}>{body}</p>
      </div>
    </div>
  )
}
